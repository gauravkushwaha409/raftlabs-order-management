import {
	ConflictException,
	Injectable,
	NotFoundException,
	UnprocessableEntityException,
} from "@nestjs/common";
import {
	concat,
	filter,
	finalize,
	from,
	type Observable,
	of,
	ReplaySubject,
	switchMap,
	takeWhile,
} from "rxjs";
import type { AuthUser } from "../../auth/types/auth.types.js";
import { REDIS_KEYS, REDIS_TTL_SECONDS } from "../../common/constant/redis-keys.js";
import { ROLES } from "../../common/constant/roles.js";
import { orderPlaced, orderStatusChanged } from "../../events/order-events.js";
import { enqueueOrderEvent } from "../../events/outbox.js";
import { PrismaService } from "../../prisma/service/prisma.service.js";
import { RedisService } from "../../redis/service/redis.service.js";
import {
	canTransition,
	isFinalStatus,
	nextStatus,
	type OrderStatus,
} from "../../common/constant/order-status.js";
import type { CreateOrderDto } from "../dto/order.dto.js";
import { type OrderView, toOrderView } from "../dto/order.view.js";
import { OrderEventsService } from "./order-events.service.js";

const withItems = { items: true } as const;

/** Cached tracking read: the response view plus the owner id for the ownership check. */
interface CachedOrder {
	view: OrderView;
	userId: string;
}

@Injectable()
export class OrdersService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly events: OrderEventsService,
		private readonly redis: RedisService,
	) {}

	async create(userId: string, dto: CreateOrderDto): Promise<OrderView> {
		const menuItems = await this.prisma.menuItem.findMany({
			where: {
				id: { in: dto.items.map((item) => item.menuItemId) },
				available: true,
			},
		});
		const byId = new Map(menuItems.map((menuItem) => [menuItem.id, menuItem]));

		// Prices always come from the DB, never from the client.
		const lines = dto.items.map(({ menuItemId, quantity }) => {
			const menuItem = byId.get(menuItemId);
			if (!menuItem) {
				throw new UnprocessableEntityException(
					`Menu item ${menuItemId} does not exist or is unavailable`,
				);
			}
			return {
				menuItemId,
				quantity,
				name: menuItem.name,
				priceCents: menuItem.priceCents,
			};
		});

		// The order and its `order.placed` event commit together or not at all.
		const order = await this.prisma.$transaction(async (tx) => {
			const created = await tx.order.create({
				data: {
					userId,
					customerName: dto.customerName,
					address: dto.address,
					phone: dto.phone,
					totalCents: lines.reduce(
						(sum, line) => sum + line.priceCents * line.quantity,
						0,
					),
					items: { create: lines },
				},
				include: withItems,
			});
			await enqueueOrderEvent(tx, orderPlaced(created));
			return created;
		});

		const view = toOrderView(order);
		await this.events.publish({ type: "created", order: view });
		return view;
	}

	async list(filter: {
		status?: OrderStatus;
		userId?: string;
		limit: number;
	}): Promise<OrderView[]> {
		const orders = await this.prisma.order.findMany({
			where: { status: filter.status, userId: filter.userId },
			orderBy: { createdAt: "desc" },
			take: filter.limit,
			include: withItems,
		});
		return orders.map(toOrderView);
	}

	/** An order as seen by `user`: owners and admins see it, everyone else gets the same 404 as a missing id. */
	async getFor(user: AuthUser, id: string): Promise<OrderView> {
		const entry = await this.readOrder(id);
		if (!entry || (user.role !== ROLES.ADMIN && entry.userId !== user.id)) {
			throw new NotFoundException(`Order ${id} not found`);
		}
		return entry.view;
	}

	async get(id: string): Promise<OrderView> {
		const entry = await this.readOrder(id);
		if (!entry) throw new NotFoundException(`Order ${id} not found`);
		return entry.view;
	}

	/** Tracking read, cache-aside. Writes below invalidate the entry. */
	private async readOrder(id: string): Promise<CachedOrder | null> {
		const key = REDIS_KEYS.ORDER_DETAIL(id);
		try {
			const cached = await this.redis.getJson<CachedOrder>(key);
			if (cached) return cached;
		} catch {
			// Fall through to the DB.
		}
		const row = await this.prisma.order.findUnique({
			where: { id },
			include: withItems,
		});
		if (!row) return null;
		const entry: CachedOrder = { view: toOrderView(row), userId: row.userId };
		try {
			await this.redis.setJson(key, entry, REDIS_TTL_SECONDS.ORDER_DETAIL);
		} catch {
			// Best-effort.
		}
		return entry;
	}

	/**
	 * Live view of one order: its current state first, then every change, completing once the
	 * order reaches a final status. Changes are buffered before the initial read so nothing is missed.
	 */
	watch(id: string): Observable<OrderView> {
		const buffer = new ReplaySubject<OrderView>();
		const subscription = this.events.stream$
			.pipe(filter((event) => event.order.id === id && event.type !== "deleted"))
			.subscribe((event) => buffer.next(event.order));
		return from(this.get(id)).pipe(
			switchMap((initial) => concat(of(initial), buffer)),
			takeWhile((order) => !isFinalStatus(order.status), true),
			finalize(() => subscription.unsubscribe()),
		);
	}

	async updateStatus(id: string, to: OrderStatus): Promise<OrderView> {
		const current = await this.get(id);
		if (!canTransition(current.status, to)) {
			throw new ConflictException(
				`Cannot move order from ${current.status} to ${to}`,
			);
		}
		const view = await this.transition(id, current.status, to);
		if (!view)
			throw new ConflictException("Order changed while updating, please retry");
		return view;
	}

	async remove(id: string): Promise<void> {
		const order = await this.get(id);
		try {
			await this.prisma.order.delete({ where: { id } });
		} catch (error) {
			// A concurrent remover won the race; report 404, not a raw P2025.
			if ((error as { code?: string }).code === "P2025")
				throw new NotFoundException(`Order ${id} not found`);
			throw error;
		}
		await this.invalidateOrder(id);
		await this.events.publish({ type: "deleted", order });
	}

	/** Orders the simulator still has to drive to a final status (used to resume after a restart). */
	async listActive(): Promise<Array<{ id: string; status: OrderStatus }>> {
		return this.prisma.order.findMany({
			where: { status: { notIn: ["DELIVERED", "CANCELLED"] } },
			select: { id: true, status: true },
		});
	}

	/**
	 * Simulator step: move `expectedFrom` one step forward. Returns the order as it is afterwards,
	 * with `advanced=false` when another instance or an admin got there first.
	 */
	async advance(
		id: string,
		expectedFrom: OrderStatus,
	): Promise<{ order: OrderView; advanced: boolean } | null> {
		const to = nextStatus(expectedFrom);
		if (!to) return null;
		const advanced = await this.transition(id, expectedFrom, to);
		if (advanced) return { order: advanced, advanced: true };
		try {
			return { order: await this.get(id), advanced: false };
		} catch (error) {
			if (error instanceof NotFoundException) return null; // deleted meanwhile
			throw error;
		}
	}

	/** Compare-and-set so concurrent writers (instances, admin vs simulator) cannot both win. */
	private async transition(
		id: string,
		from: OrderStatus,
		to: OrderStatus,
	): Promise<OrderView | null> {
		const order = await this.prisma.$transaction(async (tx) => {
			const { count } = await tx.order.updateMany({
				where: { id, status: from },
				data: { status: to },
			});
			if (count === 0) return null;
			const updated = await tx.order.findUniqueOrThrow({
				where: { id },
				include: withItems,
			});
			await enqueueOrderEvent(tx, orderStatusChanged(updated, from, to));
			return updated;
		});
		if (!order) return null;
		await this.invalidateOrder(id);
		const view = toOrderView(order);
		await this.events.publish({ type: "updated", order: view });
		return view;
	}

	private async invalidateOrder(id: string): Promise<void> {
		try {
			await this.redis.del(REDIS_KEYS.ORDER_DETAIL(id));
		} catch {
			// Best-effort: the TTL still bounds staleness.
		}
	}
}

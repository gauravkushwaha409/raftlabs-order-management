import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import type { OrderStatus } from "../src/common/constant/order-status.js";
import type {
	MenuItem,
	Notification,
	Order,
	OrderItem,
	OutboxEvent,
	User,
} from "../src/generated/prisma/client.js";

type OrderRecord = Order & { items: OrderItem[] };
type Where = {
	userId?: string;
	id?: string | { in: string[] };
	status?: OrderStatus | { notIn: OrderStatus[] };
	available?: boolean;
};

const matches = (
	record: { id: string; status?: OrderStatus; available?: boolean },
	where: Where = {},
) => {
	if (typeof where.id === "string" && record.id !== where.id) return false;
	if (typeof where.id === "object" && !where.id.in.includes(record.id))
		return false;
	if (typeof where.status === "string" && record.status !== where.status)
		return false;
	if (
		typeof where.status === "object" &&
		record.status &&
		where.status.notIn.includes(record.status)
	)
		return false;
	if (
		where.userId !== undefined &&
		(record as { userId?: string }).userId !== where.userId
	)
		return false;
	if (where.available !== undefined && record.available !== where.available)
		return false;
	return true;
};

const pick = <T extends object>(record: T, select?: Record<string, boolean>) =>
	select
		? Object.fromEntries(
				Object.keys(select).map((key) => [key, record[key as keyof T]]),
			)
		: record;

/** In-memory stand-in for the slice of PrismaService the app uses. Mirrors Prisma's semantics, not its API surface. */
export class FakePrisma {
	menuItems: MenuItem[] = [];
	orders: OrderRecord[] = [];
	users: User[] = [];
	/** Raw SQL issued through $queryRaw, in order (used to assert row locks). */
	rawQueries: string[] = [];
	/** Set false to simulate another relay holding the advisory lock. */
	advisoryLockGranted = true;

	async $queryRaw(query: TemplateStringsArray, ...values: unknown[]) {
		let sql = query[0] ?? "";
		values.forEach((value, index) => {
			sql += String(value) + (query[index + 1] ?? "");
		});
		this.rawQueries.push(sql);
		// The outbox relay's advisory lock is the one raw query whose result matters.
		return sql.includes("pg_try_advisory_xact_lock")
			? [{ locked: this.advisoryLockGranted }]
			: [];
	}

	async $transaction<T>(fn: (tx: FakePrisma) => Promise<T>): Promise<T> {
		return fn(this);
	}

	outbox: OutboxEvent[] = [];
	notifications: Notification[] = [];

	outboxEvent = {
		create: async ({
			data,
		}: {
			data: Pick<OutboxEvent, "id" | "type" | "aggregateId"> & {
				payload: unknown;
			};
		}) => {
			const event = {
				seq: this.outbox.length + 1,
				createdAt: new Date(),
				...data,
			} as OutboxEvent;
			this.outbox.push(event);
			return event;
		},
		findMany: async ({ take }: { take?: number } = {}) =>
			[...this.outbox].sort((a, b) => a.seq - b.seq).slice(0, take),
		deleteMany: async ({ where }: { where: { id: { in: string[] } } }) => {
			const before = this.outbox.length;
			this.outbox = this.outbox.filter((event) => !where.id.in.includes(event.id));
			return { count: before - this.outbox.length };
		},
	};

	notification = {
		create: async ({
			data,
		}: {
			data: Pick<
				Notification,
				"eventId" | "userId" | "orderId" | "title" | "body"
			>;
		}) => {
			if (this.notifications.some((row) => row.eventId === data.eventId))
				throw Object.assign(new Error("Unique constraint failed"), {
					code: "P2002",
				});
			const row: Notification = {
				id: randomUUID(),
				readAt: null,
				createdAt: new Date(),
				...data,
			};
			this.notifications.push(row);
			return row;
		},
		findMany: async ({
			where,
			take,
		}: {
			where: { userId: string };
			take?: number;
		}) =>
			this.notifications
				.filter((row) => row.userId === where.userId)
				.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
				.slice(0, take),
		count: async ({ where }: { where: { userId: string; readAt: null } }) =>
			this.notifications.filter(
				(row) => row.userId === where.userId && row.readAt === null,
			).length,
		updateMany: async ({
			where,
			data,
		}: {
			where: { userId: string; id?: string; readAt: null };
			data: { readAt: Date };
		}) => {
			const targets = this.notifications.filter(
				(row) =>
					row.userId === where.userId &&
					row.readAt === null &&
					(where.id === undefined || row.id === where.id),
			);
			for (const row of targets) row.readAt = data.readAt;
			return { count: targets.length };
		},
	};

	user = {
		findUnique: async ({ where }: { where: { id?: string; email?: string } }) =>
			this.users.find((user) =>
				where.id ? user.id === where.id : user.email === where.email,
			) ?? null,
		create: async ({
			data,
		}: {
			data: Pick<User, "email" | "name" | "passwordHash"> & Partial<User>;
		}) => {
			const user: User = {
				id: randomUUID(),
				role: "CUSTOMER",
				createdAt: new Date(),
				...data,
			};
			this.users.push(user);
			return user;
		},
	};

	menuItem = {
		count: async () => this.menuItems.length,
		createMany: async ({
			data,
		}: {
			data: Array<
				Omit<MenuItem, "id" | "createdAt" | "available"> & Partial<MenuItem>
			>;
		}) => {
			for (const item of data) this.addMenuItem(item);
			return { count: data.length };
		},
		findMany: async ({
			where,
			select,
		}: {
			where?: Where;
			select?: Record<string, boolean>;
		} = {}) =>
			this.menuItems
				.filter((item) => matches(item, where))
				.map((item) => pick(item, select)),
		findUnique: async ({ where }: { where: { id: string } }) =>
			this.menuItems.find((item) => item.id === where.id) ?? null,
		create: async ({
			data,
			select,
		}: {
			data: Omit<MenuItem, "id" | "createdAt">;
			select?: Record<string, boolean>;
		}) => {
			const item: MenuItem = {
				id: randomUUID(),
				createdAt: new Date(),
				...data,
			};
			this.menuItems.push(item);
			return pick(item, select);
		},
		update: async ({
			where,
			data,
			select,
		}: {
			where: { id: string };
			data: Partial<MenuItem>;
			select?: Record<string, boolean>;
		}) => {
			const item = this.menuItems.find((entry) => entry.id === where.id);
			if (!item) throw Object.assign(new Error("not found"), { code: "P2025" });
			Object.assign(item, data);
			return pick(item, select);
		},
		delete: async ({ where }: { where: { id: string } }) => {
			this.menuItems = this.menuItems.filter((item) => item.id !== where.id);
		},
	};

	order = {
		create: async ({
			data,
		}: {
			data: Record<string, unknown> & {
				items: { create: Array<Omit<OrderItem, "id" | "orderId">> };
			};
		}) => {
			const { items, ...fields } = data;
			const id = randomUUID();
			const now = new Date();
			const order = {
				id,
				status: "RECEIVED",
				createdAt: now,
				updatedAt: now,
				...fields,
				items: items.create.map((item) => ({
					id: randomUUID(),
					orderId: id,
					...item,
				})),
			} as OrderRecord;
			this.orders.push(order);
			return order;
		},
		findMany: async ({
			where,
			take,
			select,
		}: {
			where?: Where;
			take?: number;
			select?: Record<string, boolean>;
		} = {}) =>
			this.orders
				.filter((order) => matches(order, where))
				.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
				.slice(0, take)
				.map((order) => pick(order, select)),
		findUnique: async ({ where }: { where: { id: string } }) =>
			this.orders.find((order) => order.id === where.id) ?? null,
		findUniqueOrThrow: async ({ where }: { where: { id: string } }) => {
			const order = this.orders.find((row) => row.id === where.id);
			if (!order) throw new Error(`Order ${where.id} not found`);
			return order;
		},
		updateMany: async ({
			where,
			data,
		}: {
			where: Where;
			data: { status: OrderStatus };
		}) => {
			const targets = this.orders.filter((order) => matches(order, where));
			for (const order of targets)
				Object.assign(order, data, { updatedAt: new Date() });
			return { count: targets.length };
		},
		delete: async ({ where }: { where: { id: string } }) => {
			const before = this.orders.length;
			this.orders = this.orders.filter((order) => order.id !== where.id);
			if (this.orders.length === before)
				throw Object.assign(new Error("not found"), { code: "P2025" });
		},
	};

	addUser(user: Partial<User> & Pick<User, "email">): User {
		const created: User = {
			id: randomUUID(),
			name: "Test User",
			passwordHash: "unused",
			role: "CUSTOMER",
			createdAt: new Date(),
			...user,
		};
		this.users.push(created);
		return created;
	}

	addMenuItem(
		item: Partial<MenuItem> & Pick<MenuItem, "name" | "priceCents">,
	): MenuItem {
		const menuItem: MenuItem = {
			id: randomUUID(),
			description: "desc",
			image: "https://example.com/x.jpg",
			category: "Pizza",
			available: true,
			createdAt: new Date(),
			...item,
		};
		this.menuItems.push(menuItem);
		return menuItem;
	}
}

class FakeSubscriber extends EventEmitter {
	async subscribe() {}
	async quit() {}
}

/** In-memory pub/sub with the same duplicate/subscribe/publish shape as ioredis. */
export class FakeRedis {
	private readonly subscribers = new Set<FakeSubscriber>();
	private readonly store = new Map<string, string>();

	duplicate() {
		const subscriber = new FakeSubscriber();
		this.subscribers.add(subscriber);
		return subscriber;
	}

	async publish(channel: string, message: string) {
		for (const subscriber of this.subscribers)
			subscriber.emit("message", channel, message);
		return this.subscribers.size;
	}

	/** Key-value cache mirroring the JSON helpers on RedisService (no expiry — tests control staleness by clearing). */
	async get(key: string): Promise<string | null> {
		return this.store.get(key) ?? null;
	}

	async set(key: string, value: string, ..._args: unknown[]): Promise<"OK"> {
		this.store.set(key, value);
		return "OK";
	}

	async del(...keys: string[]): Promise<number> {
		let removed = 0;
		for (const key of keys) if (this.store.delete(key)) removed += 1;
		return removed;
	}

	async getJson<T>(key: string): Promise<T | null> {
		const raw = await this.get(key);
		return raw == null ? null : (JSON.parse(raw) as T);
	}

	async setJson(
		key: string,
		value: unknown,
		_ttlSeconds: number,
	): Promise<void> {
		await this.set(key, JSON.stringify(value));
	}

	clearStore() {
		this.store.clear();
	}
}

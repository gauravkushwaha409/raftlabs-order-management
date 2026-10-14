import {
	ConflictException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/service/prisma.service.js";
import {
	REDIS_KEYS,
	REDIS_TTL_SECONDS,
} from "../../redis/constant/redis-keys.js";
import { RedisService } from "../../redis/service/redis.service.js";
import type { CreateMenuItem, UpdateMenuItem } from "../dto/menu.dto.js";

export interface MenuItemView {
	id: string;
	name: string;
	description: string;
	priceCents: number;
	image: string;
	category: string;
}

export interface AdminMenuItemView extends MenuItemView {
	available: boolean;
}

const publicSelect = {
	id: true,
	name: true,
	description: true,
	priceCents: true,
	image: true,
	category: true,
} as const;

const adminSelect = { ...publicSelect, available: true } as const;

@Injectable()
export class MenuService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly redis: RedisService,
	) {}

	/** Public menu, cache-aside. Writes below invalidate the entry. */
	async list(): Promise<MenuItemView[]> {
		try {
			const cached = await this.redis.getJson<MenuItemView[]>(
				REDIS_KEYS.MENU_LIST,
			);
			if (cached) return cached;
		} catch {
			// Fall through to the DB.
		}
		const items = await this.prisma.menuItem.findMany({
			where: { available: true },
			orderBy: [{ category: "asc" }, { name: "asc" }],
			select: publicSelect,
		});
		try {
			await this.redis.setJson(
				REDIS_KEYS.MENU_LIST,
				items,
				REDIS_TTL_SECONDS.MENU_LIST,
			);
		} catch {
			// Best-effort.
		}
		return items;
	}

	/** All items, including unavailable ones (admin). */
	listAll(): Promise<AdminMenuItemView[]> {
		return this.prisma.menuItem.findMany({
			orderBy: [{ category: "asc" }, { name: "asc" }],
			select: adminSelect,
		});
	}

	create(input: CreateMenuItem): Promise<AdminMenuItemView> {
		return this.writeThrough(() =>
			this.prisma.menuItem.create({ data: input, select: adminSelect }),
		);
	}

	async update(id: string, input: UpdateMenuItem): Promise<AdminMenuItemView> {
		// Pessimistic row-level lock: concurrent writers serialize here, so the
		// read-check-write below never loses an update.
		const updated = await this.prisma.$transaction(async (tx) => {
			await tx.$queryRaw`SELECT "id" FROM "MenuItem" WHERE "id" = ${id} FOR UPDATE`;
			const existing = await tx.menuItem.findUnique({ where: { id } });
			if (!existing) throw new NotFoundException(`Menu item ${id} not found`);
			return tx.menuItem.update({
				where: { id },
				data: input,
				select: adminSelect,
			});
		});
		await this.invalidateList();
		return updated;
	}

	async remove(id: string): Promise<void> {
		// Same lock as update: a concurrent remover blocks, then sees the
		// row is gone and gets a 404 instead of a raw P2025.
		await this.prisma.$transaction(async (tx) => {
			await tx.$queryRaw`SELECT "id" FROM "MenuItem" WHERE "id" = ${id} FOR UPDATE`;
			const existing = await tx.menuItem.findUnique({ where: { id } });
			if (!existing) throw new NotFoundException(`Menu item ${id} not found`);
			try {
				await tx.menuItem.delete({ where: { id } });
			} catch (error) {
				if ((error as { code?: string }).code === "P2003") {
					throw new ConflictException(
						"Menu item is referenced by existing orders and cannot be deleted; mark it unavailable instead",
					);
				}
				throw error;
			}
		});
		await this.invalidateList();
	}

	/** Runs a write, then drops the cached list so the next read is fresh. */
	private async writeThrough<T>(write: () => Promise<T>): Promise<T> {
		const result = await write();
		await this.invalidateList();
		return result;
	}

	private async invalidateList(): Promise<void> {
		try {
			await this.redis.del(REDIS_KEYS.MENU_LIST);
		} catch {
			// Best-effort: the TTL still bounds staleness.
		}
	}
}

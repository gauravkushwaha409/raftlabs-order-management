import {
	ConflictException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import type { CreateMenuItem, UpdateMenuItem } from "./menu.dto.js";

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
	constructor(private readonly prisma: PrismaService) {}

	list(): Promise<MenuItemView[]> {
		return this.prisma.menuItem.findMany({
			where: { available: true },
			orderBy: [{ category: "asc" }, { name: "asc" }],
			select: publicSelect,
		});
	}

	/** All items, including unavailable ones (admin). */
	listAll(): Promise<AdminMenuItemView[]> {
		return this.prisma.menuItem.findMany({
			orderBy: [{ category: "asc" }, { name: "asc" }],
			select: adminSelect,
		});
	}

	create(input: CreateMenuItem): Promise<AdminMenuItemView> {
		return this.prisma.menuItem.create({ data: input, select: adminSelect });
	}

	async update(id: string, input: UpdateMenuItem): Promise<AdminMenuItemView> {
		const existing = await this.prisma.menuItem.findUnique({ where: { id } });
		if (!existing) throw new NotFoundException(`Menu item ${id} not found`);
		return this.prisma.menuItem.update({
			where: { id },
			data: input,
			select: adminSelect,
		});
	}

	async remove(id: string): Promise<void> {
		const existing = await this.prisma.menuItem.findUnique({ where: { id } });
		if (!existing) throw new NotFoundException(`Menu item ${id} not found`);
		try {
			await this.prisma.menuItem.delete({ where: { id } });
		} catch (error) {
			if ((error as { code?: string }).code === "P2003") {
				throw new ConflictException(
					"Menu item is referenced by existing orders and cannot be deleted; mark it unavailable instead",
				);
			}
			throw error;
		}
	}
}

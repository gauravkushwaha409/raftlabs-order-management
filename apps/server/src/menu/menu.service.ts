import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

export interface MenuItemView {
	id: string;
	name: string;
	description: string;
	priceCents: number;
	image: string;
	category: string;
}

@Injectable()
export class MenuService {
	constructor(private readonly prisma: PrismaService) {}

	list(): Promise<MenuItemView[]> {
		return this.prisma.menuItem.findMany({
			where: { available: true },
			orderBy: [{ category: "asc" }, { name: "asc" }],
			select: {
				id: true,
				name: true,
				description: true,
				priceCents: true,
				image: true,
				category: true,
			},
		});
	}
}

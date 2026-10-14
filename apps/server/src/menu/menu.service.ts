import {
	Injectable,
	Logger,
	type OnApplicationBootstrap,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { MENU_SEED } from "./menu.data.js";

export interface MenuItemView {
	id: string;
	name: string;
	description: string;
	priceCents: number;
	image: string;
	category: string;
}

@Injectable()
export class MenuService implements OnApplicationBootstrap {
	private readonly logger = new Logger(MenuService.name);

	constructor(private readonly prisma: PrismaService) {}

	/** Demo convenience: an empty menu table is filled once, existing menus are never touched. */
	async onApplicationBootstrap() {
		if ((await this.prisma.menuItem.count()) > 0) return;
		await this.prisma.menuItem.createMany({
			data: MENU_SEED.map((item) => ({ ...item })),
		});
		this.logger.log(`Seeded ${MENU_SEED.length} menu items`);
	}

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

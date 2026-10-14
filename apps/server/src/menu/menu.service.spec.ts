import { FakePrisma } from "../../test/fakes.js";
import type { PrismaService } from "../prisma/prisma.service.js";
import { MENU_SEED } from "./menu.data.js";
import { MenuService } from "./menu.service.js";

describe("MenuService", () => {
	it("seeds an empty menu once", async () => {
		const prisma = new FakePrisma();
		const service = new MenuService(prisma as unknown as PrismaService);

		await service.onApplicationBootstrap();
		await service.onApplicationBootstrap();

		expect(prisma.menuItems).toHaveLength(MENU_SEED.length);
	});

	it("leaves an existing menu alone", async () => {
		const prisma = new FakePrisma();
		prisma.addMenuItem({ name: "Custom", priceCents: 100 });
		await new MenuService(
			prisma as unknown as PrismaService,
		).onApplicationBootstrap();
		expect(prisma.menuItems).toHaveLength(1);
	});

	it("lists only available items with the public fields", async () => {
		const prisma = new FakePrisma();
		prisma.addMenuItem({ name: "Shown", priceCents: 100 });
		prisma.addMenuItem({ name: "Hidden", priceCents: 100, available: false });

		const items = await new MenuService(
			prisma as unknown as PrismaService,
		).list();

		expect(items.map((item) => item.name)).toEqual(["Shown"]);
		expect(Object.keys(items[0] ?? {}).sort()).toEqual([
			"category",
			"description",
			"id",
			"image",
			"name",
			"priceCents",
		]);
	});
});

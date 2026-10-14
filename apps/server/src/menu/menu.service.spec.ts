import { FakePrisma } from "../../test/fakes.js";
import type { PrismaService } from "../prisma/prisma.service.js";
import { MenuService } from "./menu.service.js";

describe("MenuService", () => {
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

import { NotFoundException } from "@nestjs/common";
import { FakePrisma } from "../../test/fakes.js";
import type { PrismaService } from "../prisma/prisma.service.js";
import { MenuService } from "./menu.service.js";

const service = (prisma: FakePrisma) =>
	new MenuService(prisma as unknown as PrismaService);

describe("MenuService", () => {
	it("lists only available items with the public fields", async () => {
		const prisma = new FakePrisma();
		prisma.addMenuItem({ name: "Shown", priceCents: 100 });
		prisma.addMenuItem({ name: "Hidden", priceCents: 100, available: false });

		const items = await service(prisma).list();

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

	it("lists all items including unavailable ones for admins", async () => {
		const prisma = new FakePrisma();
		prisma.addMenuItem({ name: "Shown", priceCents: 100 });
		prisma.addMenuItem({ name: "Hidden", priceCents: 100, available: false });

		const items = await service(prisma).listAll();

		expect(items.map((item) => item.name).sort()).toEqual(["Hidden", "Shown"]);
		expect(items.find((item) => item.name === "Hidden")?.available).toBe(false);
	});

	it("creates an item", async () => {
		const prisma = new FakePrisma();

		const item = await service(prisma).create({
			name: "Margherita",
			description: "Classic",
			priceCents: 1299,
			image: "",
			category: "Pizza",
			available: true,
		});

		expect(item.id).toBeDefined();
		expect(item.name).toBe("Margherita");
		expect(prisma.menuItems).toHaveLength(1);
	});

	it("updates an item and 404s on a missing one", async () => {
		const prisma = new FakePrisma();
		const existing = prisma.addMenuItem({ name: "Old", priceCents: 100 });

		const updated = await service(prisma).update(existing.id, {
			name: "New",
			priceCents: 200,
		});

		expect(updated.name).toBe("New");
		expect(updated.priceCents).toBe(200);
		await expect(
			service(prisma).update("00000000-0000-4000-8000-000000000000", {
				name: "Ghost",
			}),
		).rejects.toBeInstanceOf(NotFoundException);
	});

	it("removes an item and 404s on a missing one", async () => {
		const prisma = new FakePrisma();
		const existing = prisma.addMenuItem({ name: "Doomed", priceCents: 100 });

		await service(prisma).remove(existing.id);

		expect(prisma.menuItems).toHaveLength(0);
		await expect(
			service(prisma).remove("00000000-0000-4000-8000-000000000000"),
		).rejects.toBeInstanceOf(NotFoundException);
	});
});

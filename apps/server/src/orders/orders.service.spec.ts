import {
	ConflictException,
	NotFoundException,
	UnprocessableEntityException,
} from "@nestjs/common";
import { firstValueFrom, toArray } from "rxjs";
import { FakePrisma, FakeRedis } from "../../test/fakes.js";
import type { PrismaService } from "../prisma/prisma.service.js";
import type { RedisService } from "../redis/redis.service.js";
import { OrderEventsService } from "./order-events.service.js";
import { OrdersService } from "./orders.service.js";

const USER_ID = "user-1";
const customer = {
	customerName: "Ada Lovelace",
	address: "12 Analytical Way",
	phone: "+44 20 7946 0000",
};

async function setup() {
	const prisma = new FakePrisma();
	const events = new OrderEventsService(
		new FakeRedis() as unknown as RedisService,
	);
	await events.onModuleInit();
	const service = new OrdersService(prisma as unknown as PrismaService, events);
	const pizza = prisma.addMenuItem({ name: "Pizza", priceCents: 1000 });
	const soda = prisma.addMenuItem({ name: "Soda", priceCents: 250 });
	return { prisma, events, service, pizza, soda };
}

describe("OrdersService", () => {
	describe("create", () => {
		it("snapshots names and prices from the menu and totals the order", async () => {
			const { service, pizza, soda } = await setup();
			const order = await service.create(USER_ID, {
				...customer,
				items: [
					{ menuItemId: pizza.id, quantity: 2 },
					{ menuItemId: soda.id, quantity: 1 },
				],
			});

			expect(order.status).toBe("RECEIVED");
			expect(order.totalCents).toBe(2250);
			expect(order.items).toEqual([
				{ menuItemId: pizza.id, name: "Pizza", priceCents: 1000, quantity: 2 },
				{ menuItemId: soda.id, name: "Soda", priceCents: 250, quantity: 1 },
			]);
		});

		it("rejects unknown menu items", async () => {
			const { service } = await setup();
			await expect(
				service.create(USER_ID, {
					...customer,
					items: [
						{ menuItemId: "6b0c2d8e-0000-4000-8000-000000000000", quantity: 1 },
					],
				}),
			).rejects.toBeInstanceOf(UnprocessableEntityException);
		});

		it("rejects unavailable menu items", async () => {
			const { service, prisma, pizza } = await setup();
			prisma.menuItems.find((item) => item.id === pizza.id)!.available = false;
			await expect(
				service.create(USER_ID, {
					...customer,
					items: [{ menuItemId: pizza.id, quantity: 1 }],
				}),
			).rejects.toBeInstanceOf(UnprocessableEntityException);
		});

		it("publishes a created event", async () => {
			const { service, events, pizza } = await setup();
			const seen = firstValueFrom(events.stream$);
			const order = await service.create(USER_ID, {
				...customer,
				items: [{ menuItemId: pizza.id, quantity: 1 }],
			});
			expect(await seen).toEqual({ type: "created", order });
		});
	});

	describe("read", () => {
		it("gets an order by id and 404s for unknown ids", async () => {
			const { service, pizza } = await setup();
			const created = await service.create(USER_ID, {
				...customer,
				items: [{ menuItemId: pizza.id, quantity: 1 }],
			});
			expect(await service.get(created.id)).toEqual(created);
			await expect(
				service.get("6b0c2d8e-0000-4000-8000-000000000000"),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it("lists newest first, filtered by status and capped by limit", async () => {
			const { service, pizza } = await setup();
			const first = await service.create(USER_ID, {
				...customer,
				items: [{ menuItemId: pizza.id, quantity: 1 }],
			});
			await new Promise((resolve) => setTimeout(resolve, 5));
			const second = await service.create(USER_ID, {
				...customer,
				items: [{ menuItemId: pizza.id, quantity: 1 }],
			});
			await service.updateStatus(first.id, "PREPARING");

			expect((await service.list({ limit: 10 })).map((order) => order.id)).toEqual(
				[second.id, first.id],
			);
			expect(
				(await service.list({ status: "PREPARING", limit: 10 })).map(
					(order) => order.id,
				),
			).toEqual([first.id]);
			expect(await service.list({ limit: 1 })).toHaveLength(1);
		});
	});

	describe("ownership", () => {
		const owner = {
			id: USER_ID,
			email: "o@example.com",
			name: "Owner",
			role: "CUSTOMER" as const,
		};
		const stranger = { ...owner, id: "user-2" };
		const admin = { ...owner, id: "user-3", role: "ADMIN" as const };

		it("shows an order to its owner and to admins but hides it from strangers", async () => {
			const { service, pizza } = await setup();
			const created = await service.create(USER_ID, {
				...customer,
				items: [{ menuItemId: pizza.id, quantity: 1 }],
			});

			expect(await service.getFor(owner, created.id)).toEqual(created);
			expect(await service.getFor(admin, created.id)).toEqual(created);
			await expect(service.getFor(stranger, created.id)).rejects.toBeInstanceOf(
				NotFoundException,
			);
		});

		it("lists only the given user's orders", async () => {
			const { service, pizza } = await setup();
			const mine = await service.create(USER_ID, {
				...customer,
				items: [{ menuItemId: pizza.id, quantity: 1 }],
			});
			await service.create("user-2", {
				...customer,
				items: [{ menuItemId: pizza.id, quantity: 1 }],
			});

			expect(
				(await service.list({ userId: USER_ID, limit: 10 })).map(
					(order) => order.id,
				),
			).toEqual([mine.id]);
			expect(await service.list({ limit: 10 })).toHaveLength(2);
		});
	});

	describe("updateStatus", () => {
		it("moves along allowed transitions and publishes updates", async () => {
			const { service, events, pizza } = await setup();
			const created = await service.create(USER_ID, {
				...customer,
				items: [{ menuItemId: pizza.id, quantity: 1 }],
			});
			const seen = firstValueFrom(events.stream$);

			const updated = await service.updateStatus(created.id, "PREPARING");

			expect(updated.status).toBe("PREPARING");
			expect(await seen).toEqual({ type: "updated", order: updated });
		});

		it("rejects invalid transitions with 409", async () => {
			const { service, pizza } = await setup();
			const created = await service.create(USER_ID, {
				...customer,
				items: [{ menuItemId: pizza.id, quantity: 1 }],
			});
			await expect(
				service.updateStatus(created.id, "DELIVERED"),
			).rejects.toBeInstanceOf(ConflictException);
			await service.updateStatus(created.id, "CANCELLED");
			await expect(
				service.updateStatus(created.id, "PREPARING"),
			).rejects.toBeInstanceOf(ConflictException);
		});

		it("404s for unknown orders", async () => {
			const { service } = await setup();
			await expect(
				service.updateStatus("6b0c2d8e-0000-4000-8000-000000000000", "PREPARING"),
			).rejects.toBeInstanceOf(NotFoundException);
		});
	});

	describe("advance (simulator step)", () => {
		it("advances once and reports when someone else already did", async () => {
			const { service, pizza } = await setup();
			const created = await service.create(USER_ID, {
				...customer,
				items: [{ menuItemId: pizza.id, quantity: 1 }],
			});

			const first = await service.advance(created.id, "RECEIVED");
			const stale = await service.advance(created.id, "RECEIVED");

			expect(first).toMatchObject({
				advanced: true,
				order: { status: "PREPARING" },
			});
			expect(stale).toMatchObject({
				advanced: false,
				order: { status: "PREPARING" },
			});
		});

		it("returns null for final statuses and deleted orders", async () => {
			const { service, pizza } = await setup();
			const created = await service.create(USER_ID, {
				...customer,
				items: [{ menuItemId: pizza.id, quantity: 1 }],
			});
			expect(await service.advance(created.id, "DELIVERED")).toBeNull();
			await service.remove(created.id);
			expect(await service.advance(created.id, "RECEIVED")).toBeNull();
		});
	});

	describe("remove", () => {
		it("deletes the order, publishes deleted and 404s afterwards", async () => {
			const { service, events, pizza } = await setup();
			const created = await service.create(USER_ID, {
				...customer,
				items: [{ menuItemId: pizza.id, quantity: 1 }],
			});
			const seen = firstValueFrom(events.stream$);

			await service.remove(created.id);

			expect(await seen).toEqual({ type: "deleted", order: created });
			await expect(service.get(created.id)).rejects.toBeInstanceOf(
				NotFoundException,
			);
		});
	});

	describe("watch", () => {
		it("emits the current state, then changes, and completes on a final status", async () => {
			const { service, pizza } = await setup();
			const created = await service.create(USER_ID, {
				...customer,
				items: [{ menuItemId: pizza.id, quantity: 1 }],
			});

			const collected = firstValueFrom(service.watch(created.id).pipe(toArray()));
			await new Promise((resolve) => setTimeout(resolve, 0));
			await service.updateStatus(created.id, "PREPARING");
			await service.updateStatus(created.id, "OUT_FOR_DELIVERY");
			await service.updateStatus(created.id, "DELIVERED");

			expect((await collected).map((order) => order.status)).toEqual([
				"RECEIVED",
				"PREPARING",
				"OUT_FOR_DELIVERY",
				"DELIVERED",
			]);
		});

		it("errors with 404 for unknown orders", async () => {
			const { service } = await setup();
			await expect(
				firstValueFrom(service.watch("6b0c2d8e-0000-4000-8000-000000000000")),
			).rejects.toBeInstanceOf(NotFoundException);
		});
	});
});

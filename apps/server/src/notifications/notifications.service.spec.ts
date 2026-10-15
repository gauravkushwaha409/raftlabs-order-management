import { NotFoundException } from "@nestjs/common";
import { FakePrisma, FakeRedis } from "../../test/fakes.js";
import {
	type OrderDomainEvent,
	orderPlaced,
	orderStatusChanged,
} from "../events/order-events.js";
import type { PrismaService } from "../prisma/prisma.service.js";
import type { RedisService } from "../redis/redis.service.js";
import { NotificationEventsService } from "./notification-events.service.js";
import { NotificationsService } from "./notifications.service.js";

const USER = "6b0c2d8e-0000-4000-8000-000000000001";
const OTHER = "6b0c2d8e-0000-4000-8000-000000000002";
const ORDER = "6b0c2d8e-0000-4000-8000-0000000000aa";

async function setup() {
	const prisma = new FakePrisma();
	const live = new NotificationEventsService(
		new FakeRedis() as unknown as RedisService,
	);
	await live.onModuleInit();
	const service = new NotificationsService(
		prisma as unknown as PrismaService,
		live,
	);
	return { prisma, live, service };
}

const placed = (): OrderDomainEvent =>
	orderPlaced({
		id: ORDER,
		userId: USER,
		totalCents: 2250,
		items: [{ quantity: 2 }, { quantity: 1 }],
	});

describe("NotificationsService", () => {
	describe("createFromEvent", () => {
		it("writes a customer-facing notification and pushes it live", async () => {
			const { prisma, live, service } = await setup();
			const pushed: unknown[] = [];
			live.stream$.subscribe((event) => pushed.push(event));

			const created = await service.createFromEvent(placed());
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(created).toMatchObject({
				orderId: ORDER,
				title: "Order received",
				body: expect.stringContaining("3 items ($22.50)"),
				read: false,
			});
			expect(prisma.notifications).toHaveLength(1);
			expect(pushed).toEqual([{ userId: USER, notification: created }]);
		});

		it("ignores a redelivered event", async () => {
			const { prisma, service } = await setup();
			const event = placed();

			await service.createFromEvent(event);
			const again = await service.createFromEvent(event);

			expect(again).toBeNull();
			expect(prisma.notifications).toHaveLength(1);
		});

		it.each([
			["PREPARING", "Preparing your order"],
			["OUT_FOR_DELIVERY", "Out for delivery"],
			["DELIVERED", "Delivered"],
			["CANCELLED", "Order cancelled"],
		] as const)("describes a move to %s", async (to, title) => {
			const { service } = await setup();
			const created = await service.createFromEvent(
				orderStatusChanged({ id: ORDER, userId: USER }, "RECEIVED", to),
			);
			expect(created?.title).toBe(title);
		});

		it("rethrows unexpected database errors so the message is retried", async () => {
			const { prisma, service } = await setup();
			prisma.notification.create = async () => {
				throw new Error("connection reset");
			};
			await expect(service.createFromEvent(placed())).rejects.toThrow(
				"connection reset",
			);
		});
	});

	describe("reading", () => {
		it("lists only the caller's notifications, newest first, with the unread count", async () => {
			const { service } = await setup();
			await service.createFromEvent(placed());
			await service.createFromEvent(
				orderStatusChanged({ id: ORDER, userId: USER }, "RECEIVED", "PREPARING"),
			);
			await service.createFromEvent({
				...placed(),
				data: { ...placed().data, userId: OTHER },
			} as OrderDomainEvent);

			const { items, unreadCount } = await service.list(USER);

			expect(items.map((item) => item.title)).toEqual([
				"Preparing your order",
				"Order received",
			]);
			expect(unreadCount).toBe(2);
		});

		it("marks one notification read", async () => {
			const { service } = await setup();
			const created = await service.createFromEvent(placed());

			await service.markRead(USER, created?.id ?? "");

			const { items, unreadCount } = await service.list(USER);
			expect(items[0]?.read).toBe(true);
			expect(unreadCount).toBe(0);
		});

		it("answers 404 for someone else's or an unknown notification", async () => {
			const { service } = await setup();
			const created = await service.createFromEvent(placed());

			await expect(
				service.markRead(OTHER, created?.id ?? ""),
			).rejects.toBeInstanceOf(NotFoundException);
			await expect(service.markRead(USER, ORDER)).rejects.toBeInstanceOf(
				NotFoundException,
			);
			expect((await service.list(USER)).unreadCount).toBe(1);
		});

		it("marks everything of the caller read and leaves other users alone", async () => {
			const { service } = await setup();
			await service.createFromEvent(placed());
			await service.createFromEvent({
				...placed(),
				data: { ...placed().data, userId: OTHER },
			} as OrderDomainEvent);

			await service.markAllRead(USER);

			expect((await service.list(USER)).unreadCount).toBe(0);
			expect((await service.list(OTHER)).unreadCount).toBe(1);
		});
	});
});

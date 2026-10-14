import { FakePrisma, FakeRedis } from "../../test/fakes.js";
import type { PrismaService } from "../prisma/prisma.service.js";
import type { RedisService } from "../redis/redis.service.js";
import { OrderEventsService } from "./order-events.service.js";
import { OrderSimulatorService } from "./order-simulator.service.js";
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
	const orders = new OrdersService(prisma as unknown as PrismaService, events);
	const simulator = new OrderSimulatorService(orders, events);
	await simulator.onApplicationBootstrap();
	const pizza = prisma.addMenuItem({ name: "Pizza", priceCents: 1000 });
	return { prisma, orders, simulator, pizza };
}

describe("OrderSimulatorService", () => {
	beforeEach(() => {
		process.env.ORDER_STEP_MS = "1000";
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
		delete process.env.ORDER_STEP_MS;
	});

	it("walks a new order through every status", async () => {
		const { orders, simulator, pizza } = await setup();
		const { id } = await orders.create(USER_ID, {
			...customer,
			items: [{ menuItemId: pizza.id, quantity: 1 }],
		});

		const statuses: string[] = [];
		for (let step = 0; step < 3; step++) {
			await vi.advanceTimersByTimeAsync(1000);
			statuses.push((await orders.get(id)).status);
		}

		expect(statuses).toEqual(["PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"]);
		simulator.onModuleDestroy();
	});

	it("stops advancing a cancelled order", async () => {
		const { orders, simulator, pizza } = await setup();
		const { id } = await orders.create(USER_ID, {
			...customer,
			items: [{ menuItemId: pizza.id, quantity: 1 }],
		});
		await orders.updateStatus(id, "CANCELLED");

		await vi.advanceTimersByTimeAsync(5000);

		expect((await orders.get(id)).status).toBe("CANCELLED");
		simulator.onModuleDestroy();
	});

	it("does not double-advance when an admin moved the order meanwhile", async () => {
		const { orders, simulator, pizza } = await setup();
		const { id } = await orders.create(USER_ID, {
			...customer,
			items: [{ menuItemId: pizza.id, quantity: 1 }],
		});
		await orders.updateStatus(id, "PREPARING"); // admin jumps ahead before the first tick

		await vi.advanceTimersByTimeAsync(1000);
		expect((await orders.get(id)).status).toBe("PREPARING"); // stale RECEIVED step lost the compare-and-set

		await vi.advanceTimersByTimeAsync(1000);
		expect((await orders.get(id)).status).toBe("OUT_FOR_DELIVERY");
		simulator.onModuleDestroy();
	});

	it("resumes unfinished orders after a restart", async () => {
		const { prisma, orders, pizza } = await setup();
		const { id } = await orders.create(USER_ID, {
			...customer,
			items: [{ menuItemId: pizza.id, quantity: 1 }],
		});

		const restarted = new OrderSimulatorService(
			orders,
			new OrderEventsService(new FakeRedis() as unknown as RedisService),
		);
		await restarted.onApplicationBootstrap();
		await vi.advanceTimersByTimeAsync(1000);

		expect(prisma.orders.find((order) => order.id === id)?.status).not.toBe(
			"RECEIVED",
		);
		restarted.onModuleDestroy();
	});
});

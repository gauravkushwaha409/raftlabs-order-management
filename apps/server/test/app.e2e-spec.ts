import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";
import { RedisService } from "../src/redis/redis.service.js";
import { FakePrisma, FakeRedis } from "./fakes.js";

const ADMIN_KEY = "e2e-admin-key-0123456789";
const customer = {
	customerName: "Ada Lovelace",
	address: "12 Analytical Way",
	phone: "+44 20 7946 0000",
};

describe("API (e2e)", () => {
	let app: INestApplication;
	let prisma: FakePrisma;
	let pizzaId: string;
	let http: ReturnType<typeof request>;

	beforeAll(async () => {
		process.env.ADMIN_API_KEY = ADMIN_KEY;
		process.env.ORDER_STEP_MS = "3600000"; // keep the simulator out of the way
		prisma = new FakePrisma();
		pizzaId = prisma.addMenuItem({ name: "Pizza", priceCents: 1000 }).id;
		prisma.addMenuItem({ name: "Burger", priceCents: 900, category: "Burgers" });

		const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
			.overrideProvider(PrismaService)
			.useValue(prisma)
			.overrideProvider(RedisService)
			.useValue(new FakeRedis())
			.compile();
		app = moduleRef.createNestApplication();
		app.setGlobalPrefix("/api/v1");
		await app.init();
		http = request(app.getHttpServer());
	});

	afterAll(async () => {
		await app.close();
		delete process.env.ADMIN_API_KEY;
		delete process.env.ORDER_STEP_MS;
	});

	const placeOrder = (
		body: object = { ...customer, items: [{ menuItemId: pizzaId, quantity: 2 }] },
	) => http.post("/api/v1/orders").send(body);
	const admin = { "x-admin-key": ADMIN_KEY };

	describe("health + menu", () => {
		it("GET /api/v1 is healthy", () =>
			http.get("/api/v1").expect(200, { status: "ok" }));

		it("GET /api/v1/menu lists menu items", async () => {
			const { body } = await http.get("/api/v1/menu").expect(200);
			expect(body).toHaveLength(2);
			expect(body[0]).toEqual(
				expect.objectContaining({
					name: expect.any(String),
					priceCents: expect.any(Number),
				}),
			);
		});
	});

	describe("POST /orders", () => {
		it("creates an order priced from the menu", async () => {
			const { body } = await placeOrder().expect(201);
			expect(body).toMatchObject({
				status: "RECEIVED",
				totalCents: 2000,
				customerName: "Ada Lovelace",
			});
			expect(body.items).toEqual([
				{ menuItemId: pizzaId, name: "Pizza", priceCents: 1000, quantity: 2 },
			]);
		});

		it("ignores client-supplied prices and totals", async () => {
			const { body } = await placeOrder({
				...customer,
				totalCents: 1,
				items: [{ menuItemId: pizzaId, quantity: 1, priceCents: 1 }],
			}).expect(201);
			expect(body.totalCents).toBe(1000);
		});

		it.each([
			[
				"missing name",
				{
					...customer,
					customerName: "",
					items: [{ menuItemId: "x", quantity: 1 }],
				},
			],
			["short address", { ...customer, address: "abc" }],
			["bad phone", { ...customer, phone: "call me" }],
			["no items", { ...customer, items: [] }],
			[
				"zero quantity",
				{
					...customer,
					items: [
						{ menuItemId: "6b0c2d8e-0000-4000-8000-000000000000", quantity: 0 },
					],
				},
			],
			[
				"huge quantity",
				{
					...customer,
					items: [
						{ menuItemId: "6b0c2d8e-0000-4000-8000-000000000000", quantity: 21 },
					],
				},
			],
			[
				"fractional quantity",
				{
					...customer,
					items: [
						{ menuItemId: "6b0c2d8e-0000-4000-8000-000000000000", quantity: 1.5 },
					],
				},
			],
			[
				"non-uuid item id",
				{ ...customer, items: [{ menuItemId: "pizza", quantity: 1 }] },
			],
		])("400s on %s", async (_label, payload) => {
			await http.post("/api/v1/orders").send(payload).expect(400);
		});

		it("400s on duplicate menu items", () =>
			placeOrder({
				...customer,
				items: [
					{ menuItemId: pizzaId, quantity: 1 },
					{ menuItemId: pizzaId, quantity: 1 },
				],
			}).expect(400));

		it("422s on unknown menu items", () =>
			placeOrder({
				...customer,
				items: [
					{ menuItemId: "6b0c2d8e-0000-4000-8000-000000000000", quantity: 1 },
				],
			}).expect(422));
	});

	describe("GET /orders/:id", () => {
		it("returns an order by id", async () => {
			const { body: created } = await placeOrder().expect(201);
			const { body } = await http.get(`/api/v1/orders/${created.id}`).expect(200);
			expect(body).toEqual(created);
		});

		it("404s for unknown ids and 400s for malformed ids", async () => {
			await http
				.get("/api/v1/orders/6b0c2d8e-0000-4000-8000-000000000000")
				.expect(404);
			await http.get("/api/v1/orders/not-a-uuid").expect(400);
		});
	});

	describe("admin endpoints", () => {
		it("require the admin key", async () => {
			const { body: order } = await placeOrder().expect(201);
			await http.get("/api/v1/orders").expect(401);
			await http.get("/api/v1/orders").set("x-admin-key", "wrong").expect(401);
			await http
				.patch(`/api/v1/orders/${order.id}/status`)
				.send({ status: "PREPARING" })
				.expect(401);
			await http.delete(`/api/v1/orders/${order.id}`).expect(401);
		});

		it("GET /orders lists, filters by status and validates the query", async () => {
			const { body: order } = await placeOrder().expect(201);
			await http
				.patch(`/api/v1/orders/${order.id}/status`)
				.set(admin)
				.send({ status: "CANCELLED" })
				.expect(200);

			const all = await http.get("/api/v1/orders").set(admin).expect(200);
			expect(all.body.length).toBeGreaterThan(1);
			const cancelled = await http
				.get("/api/v1/orders?status=CANCELLED")
				.set(admin)
				.expect(200);
			expect(
				cancelled.body.every((o: { status: string }) => o.status === "CANCELLED"),
			).toBe(true);
			await http.get("/api/v1/orders?status=BOGUS").set(admin).expect(400);
			await http
				.get("/api/v1/orders?limit=1")
				.set(admin)
				.expect(200)
				.expect((res) => expect(res.body).toHaveLength(1));
		});

		it("PATCH /orders/:id/status walks the lifecycle and rejects bad transitions", async () => {
			const { body: order } = await placeOrder().expect(201);
			const patch = (status: string) =>
				http.patch(`/api/v1/orders/${order.id}/status`).set(admin).send({ status });

			await patch("PREPARING")
				.expect(200)
				.expect((res) => expect(res.body.status).toBe("PREPARING"));
			await patch("DELIVERED").expect(409);
			await patch("OUT_FOR_DELIVERY").expect(200);
			await patch("DELIVERED").expect(200);
			await patch("PREPARING").expect(409);
			await patch("NOPE").expect(400);
			await http
				.patch("/api/v1/orders/6b0c2d8e-0000-4000-8000-000000000000/status")
				.set(admin)
				.send({ status: "PREPARING" })
				.expect(404);
		});

		it("DELETE /orders/:id removes the order", async () => {
			const { body: order } = await placeOrder().expect(201);
			await http.delete(`/api/v1/orders/${order.id}`).set(admin).expect(204);
			await http.get(`/api/v1/orders/${order.id}`).expect(404);
			await http.delete(`/api/v1/orders/${order.id}`).set(admin).expect(404);
		});
	});

	describe("GET /orders/:id/events (SSE)", () => {
		it("404s before opening the stream for unknown orders", () =>
			http
				.get("/api/v1/orders/6b0c2d8e-0000-4000-8000-000000000000/events")
				.expect(404));

		it("streams the current status then live updates until the order is final", async () => {
			const { body: order } = await placeOrder().expect(201);
			const address =
				app.getHttpServer().address() ??
				(await new Promise((resolve) =>
					app
						.getHttpServer()
						.listen(0, () => resolve(app.getHttpServer().address())),
				));
			const { port } = address as { port: number };

			const response = await fetch(
				`http://127.0.0.1:${port}/api/v1/orders/${order.id}/events`,
			);
			expect(response.headers.get("content-type")).toContain("text/event-stream");
			const reader = response.body!.getReader();
			const decoder = new TextDecoder();
			let received = "";
			const readUntil = async (marker: string) => {
				while (!received.includes(marker)) {
					const { value, done } = await reader.read();
					if (done) break;
					received += decoder.decode(value);
				}
			};

			await readUntil('"status":"RECEIVED"');
			await http
				.patch(`/api/v1/orders/${order.id}/status`)
				.set(admin)
				.send({ status: "CANCELLED" })
				.expect(200);
			await readUntil('"status":"CANCELLED"');
			const { done } = await reader.read(); // stream completes after the final status
			expect(done).toBe(true);
			expect(received).toContain("event: order");
		});
	});
});

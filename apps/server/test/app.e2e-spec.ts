import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { io } from "socket.io-client";
import request from "supertest";
import { AppModule } from "../src/app.module.js";
import { configureApp } from "../src/app.setup.js";
import { hashPassword } from "../src/auth/util/password.js";
import { KafkaConsumerService } from "../src/kafka/kafka-consumer.service.js";
import { KafkaProducerService } from "../src/kafka/kafka-producer.service.js";
import { KafkaTopicsService } from "../src/kafka/kafka-topics.service.js";
import { PrismaService } from "../src/prisma/service/prisma.service.js";
import { RedisService } from "../src/redis/service/redis.service.js";
import { WorkerModule } from "../src/worker.module.js";
import { FakeKafka } from "./fake-kafka.js";
import { FakePrisma, FakeRedis } from "./fakes.js";

const ADMIN = { email: "admin@example.com", password: "admin-password-1" };
const customer = {
	customerName: "Ada Lovelace",
	address: "12 Analytical Way",
	phone: "+44 20 7946 0000",
};
const UNKNOWN_ID = "6b0c2d8e-0000-4000-8000-000000000000";

describe("API (e2e)", () => {
	let app: INestApplication;
	let prisma: FakePrisma;
	let kafka: FakeKafka;
	let pizzaId: string;
	let http: ReturnType<typeof request>;
	let baseUrl: string;
	let emailCounter = 0;

	beforeAll(async () => {
		process.env.JWT_SECRET = "e2e-secret-e2e-secret-e2e-secret-1234";
		// The status simulator is opt-in (ORDER_SIMULATOR_ENABLED=true) and stays
		// off here, so orders only move through explicit admin actions.
		prisma = new FakePrisma();
		prisma.addUser({
			email: ADMIN.email,
			name: "Admin",
			role: "ADMIN",
			passwordHash: await hashPassword(ADMIN.password),
		});
		pizzaId = prisma.addMenuItem({ name: "Pizza", priceCents: 1000 }).id;
		prisma.addMenuItem({ name: "Burger", priceCents: 900, category: "Burgers" });

		kafka = new FakeKafka();
		// API and worker run side by side here; only the Kafka client and topic admin are faked.
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule, WorkerModule],
		})
			.overrideProvider(KafkaProducerService)
			.useValue(kafka.producer)
			.overrideProvider(KafkaConsumerService)
			.useValue(kafka.consumer)
			.overrideProvider(KafkaTopicsService)
			.useValue({})
			.overrideProvider(PrismaService)
			.useValue(prisma)
			.overrideProvider(RedisService)
			.useValue(new FakeRedis())
			.compile();
		app = moduleRef.createNestApplication();
		configureApp(app);
		await app.init();
		await app.listen(0, "127.0.0.1");
		baseUrl = await app.getUrl();
		http = request(baseUrl);
	});

	afterAll(async () => {
		await app.close();
		for (const key of ["JWT_SECRET"]) delete process.env[key];
	});

	const cookieFrom = (response: request.Response) =>
		(response.headers["set-cookie"] as unknown as string[])[0]?.split(";")[0] ??
		"";

	/** Registers a fresh customer and returns their session cookie. */
	async function signUp(name = "Ada") {
		const email = `user${++emailCounter}@example.com`;
		const response = await http
			.post("/api/v1/auth/register")
			.send({ name, email, password: "analytical-engine" })
			.expect(201);
		return {
			cookie: cookieFrom(response),
			user: response.body.data as { id: string; email: string },
		};
	}

	async function signInAdmin() {
		const response = await http
			.post("/api/v1/auth/login")
			.send(ADMIN)
			.expect(200);
		return cookieFrom(response);
	}

	const placeOrder = (
		cookie: string,
		body: object = { ...customer, items: [{ menuItemId: pizzaId, quantity: 2 }] },
	) => http.post("/api/v1/orders").set("Cookie", cookie).send(body);

	describe("health + menu", () => {
		it("GET /api/v1 is healthy", () =>
			http
				.get("/api/v1")
				.expect(200)
				.expect((res) =>
					expect(res.body).toEqual({
						success: true,
						statusCode: 200,
						message: "Data fetched successfully",
						data: { status: "ok" },
					}),
				));

		it("GET /api/v1/menu is public", async () => {
			const { body } = await http.get("/api/v1/menu").expect(200);
			expect(body.data).toHaveLength(2);
			expect(body.data[0]).toEqual(
				expect.objectContaining({
					name: expect.any(String),
					priceCents: expect.any(Number),
				}),
			);
		});
	});

	describe("auth", () => {
		it("registers, sets an httpOnly session cookie and never leaks the hash", async () => {
			const response = await http
				.post("/api/v1/auth/register")
				.send({
					name: "Grace Hopper",
					email: "Grace@Example.com",
					password: "compiler-first",
				})
				.expect(201);

			expect(response.body.data).toEqual({
				id: expect.any(String),
				email: "grace@example.com",
				name: "Grace Hopper",
				role: "CUSTOMER",
			});
			const setCookie =
				(response.headers["set-cookie"] as unknown as string[])[0] ?? "";
			expect(setCookie).toMatch(/^access_token=/);
			expect(setCookie).toMatch(/HttpOnly/i);
			expect(setCookie).toMatch(/SameSite=Lax/i);
			expect(JSON.stringify(response.body)).not.toMatch(/password|hash/i);
		});

		it("409s on a duplicate email, case-insensitively", async () => {
			const { user } = await signUp();
			await http
				.post("/api/v1/auth/register")
				.send({
					name: "Again",
					email: user.email.toUpperCase(),
					password: "analytical-engine",
				})
				.expect(409);
		});

		it.each([
			[
				"bad email",
				{ name: "Ada", email: "not-an-email", password: "analytical-engine" },
			],
			[
				"short password",
				{ name: "Ada", email: "a@example.com", password: "short" },
			],
			[
				"short name",
				{ name: "A", email: "a@example.com", password: "analytical-engine" },
			],
			["missing fields", {}],
		])("400s on register with %s", async (_label, payload) => {
			await http.post("/api/v1/auth/register").send(payload).expect(400);
		});

		it("logs in, and answers wrong passwords and unknown emails identically", async () => {
			const { user } = await signUp();
			const ok = await http
				.post("/api/v1/auth/login")
				.send({ email: user.email, password: "analytical-engine" })
				.expect(200);
			expect(ok.body.data).toMatchObject({ email: user.email, role: "CUSTOMER" });
			expect(cookieFrom(ok)).toMatch(/^access_token=/);

			const wrong = await http
				.post("/api/v1/auth/login")
				.send({ email: user.email, password: "wrong-password" })
				.expect(401);
			const unknown = await http
				.post("/api/v1/auth/login")
				.send({ email: "nobody@example.com", password: "wrong-password" })
				.expect(401);
			expect(unknown.body.message).toBe(wrong.body.message);
		});

		it("GET /auth/me needs a valid session", async () => {
			const { cookie, user } = await signUp();
			await http.get("/api/v1/auth/me").expect(401);
			await http.get("/api/v1/auth/me").set("Cookie", `${cookie}x`).expect(401);
			await http
				.get("/api/v1/auth/me")
				.set("Cookie", cookie)
				.expect(200)
				.expect((res) => expect(res.body.data.email).toBe(user.email));
		});

		it("logout clears the cookie", async () => {
			const { cookie } = await signUp();
			const response = await http
				.post("/api/v1/auth/logout")
				.set("Cookie", cookie)
				.expect(204);
			expect((response.headers["set-cookie"] as unknown as string[])[0]).toMatch(
				/access_token=;/,
			);
		});

		it("an admin account can sign in with the ADMIN role", async () => {
			const response = await http
				.post("/api/v1/auth/login")
				.send(ADMIN)
				.expect(200);
			expect(response.body.data.role).toBe("ADMIN");
		});
	});

	describe("POST /orders", () => {
		it("requires sign-in", () =>
			http
				.post("/api/v1/orders")
				.send({ ...customer, items: [{ menuItemId: pizzaId, quantity: 1 }] })
				.expect(401));

		it("creates an order owned by the user, priced from the menu", async () => {
			const { cookie, user } = await signUp();
			const { body } = await placeOrder(cookie).expect(201);

			expect(body.data).toMatchObject({
				status: "RECEIVED",
				totalCents: 2000,
				customerName: "Ada Lovelace",
			});
			expect(body.data.items).toEqual([
				{ menuItemId: pizzaId, name: "Pizza", priceCents: 1000, quantity: 2 },
			]);
			expect(
				prisma.orders.find((order) => order.id === body.data.id)?.userId,
			).toBe(user.id);
		});

		it("ignores client-supplied prices, totals and owners", async () => {
			const { cookie, user } = await signUp();
			const { body } = await placeOrder(cookie, {
				...customer,
				totalCents: 1,
				userId: "someone-else",
				items: [{ menuItemId: pizzaId, quantity: 1, priceCents: 1 }],
			}).expect(201);

			expect(body.data.totalCents).toBe(1000);
			expect(
				prisma.orders.find((order) => order.id === body.data.id)?.userId,
			).toBe(user.id);
		});

		it.each([
			["missing name", { ...customer, customerName: "" }],
			["short address", { ...customer, address: "abc" }],
			["bad phone", { ...customer, phone: "call me" }],
			["no items", { ...customer, items: [] }],
			[
				"zero quantity",
				{ ...customer, items: [{ menuItemId: UNKNOWN_ID, quantity: 0 }] },
			],
			[
				"huge quantity",
				{ ...customer, items: [{ menuItemId: UNKNOWN_ID, quantity: 21 }] },
			],
			[
				"fractional quantity",
				{ ...customer, items: [{ menuItemId: UNKNOWN_ID, quantity: 1.5 }] },
			],
			[
				"non-uuid item id",
				{ ...customer, items: [{ menuItemId: "pizza", quantity: 1 }] },
			],
		])("400s on %s", async (_label, payload) => {
			const { cookie } = await signUp();
			await http
				.post("/api/v1/orders")
				.set("Cookie", cookie)
				.send(payload)
				.expect(400);
		});

		it("400s on duplicate menu items and 422s on unknown ones", async () => {
			const { cookie } = await signUp();
			await placeOrder(cookie, {
				...customer,
				items: [
					{ menuItemId: pizzaId, quantity: 1 },
					{ menuItemId: pizzaId, quantity: 1 },
				],
			}).expect(400);
			await placeOrder(cookie, {
				...customer,
				items: [{ menuItemId: UNKNOWN_ID, quantity: 1 }],
			}).expect(422);
		});
	});

	describe("reading orders", () => {
		it("lets owners and admins read an order and hides it from everyone else", async () => {
			const owner = await signUp();
			const stranger = await signUp();
			const adminCookie = await signInAdmin();
			const { body: created } = await placeOrder(owner.cookie).expect(201);
			const order = created.data as { id: string };
			const url = `/api/v1/orders/${order.id}`;

			await http.get(url).expect(401);
			await http
				.get(url)
				.set("Cookie", owner.cookie)
				.expect(200)
				.expect((res) => expect(res.body.data).toEqual(order));
			await http
				.get(url)
				.set("Cookie", adminCookie)
				.expect(200)
				.expect((res) => expect(res.body.data).toEqual(order));
			await http.get(url).set("Cookie", stranger.cookie).expect(404);
		});

		it("404s unknown ids and 400s malformed ids", async () => {
			const { cookie } = await signUp();
			await http
				.get(`/api/v1/orders/${UNKNOWN_ID}`)
				.set("Cookie", cookie)
				.expect(404);
			await http
				.get("/api/v1/orders/not-a-uuid")
				.set("Cookie", cookie)
				.expect(400);
		});

		it("GET /orders/mine returns only the caller's orders", async () => {
			const me = await signUp();
			const other = await signUp();
			const { body: mine } = await placeOrder(me.cookie).expect(201);
			await placeOrder(other.cookie).expect(201);

			await http.get("/api/v1/orders/mine").expect(401);
			const { body } = await http
				.get("/api/v1/orders/mine")
				.set("Cookie", me.cookie)
				.expect(200);
			expect(body.data.map((order: { id: string }) => order.id)).toEqual([
				mine.data.id,
			]);
		});
	});

	describe("admin endpoints", () => {
		it("reject anonymous callers with 401 and customers with 403", async () => {
			const { cookie } = await signUp();
			const { body: created } = await placeOrder(cookie).expect(201);
			const order = created.data as { id: string };

			await http.get("/api/v1/orders").expect(401);
			await http.get("/api/v1/orders").set("Cookie", cookie).expect(403);
			await http
				.patch(`/api/v1/orders/${order.id}/status`)
				.set("Cookie", cookie)
				.send({ status: "CANCELLED" })
				.expect(403);
			await http
				.delete(`/api/v1/orders/${order.id}`)
				.set("Cookie", cookie)
				.expect(403);
			await http
				.patch(`/api/v1/orders/${order.id}/status`)
				.send({ status: "CANCELLED" })
				.expect(401);
		});

		it("GET /orders lists everything, filters by status and validates the query", async () => {
			const { cookie } = await signUp();
			const adminCookie = await signInAdmin();
			const { body: created } = await placeOrder(cookie).expect(201);
			const order = created.data as { id: string };
			await http
				.patch(`/api/v1/orders/${order.id}/status`)
				.set("Cookie", adminCookie)
				.send({ status: "CANCELLED" })
				.expect(200);

			const all = await http
				.get("/api/v1/orders")
				.set("Cookie", adminCookie)
				.expect(200);
			expect(all.body.data.length).toBeGreaterThan(1);
			const cancelled = await http
				.get("/api/v1/orders?status=CANCELLED")
				.set("Cookie", adminCookie)
				.expect(200);
			expect(
				cancelled.body.data.every(
					(o: { status: string }) => o.status === "CANCELLED",
				),
			).toBe(true);
			await http
				.get("/api/v1/orders?status=BOGUS")
				.set("Cookie", adminCookie)
				.expect(400);
			await http
				.get("/api/v1/orders?limit=1")
				.set("Cookie", adminCookie)
				.expect(200)
				.expect((res) => expect(res.body.data).toHaveLength(1));
		});

		it("PATCH walks the lifecycle and rejects bad transitions", async () => {
			const { cookie } = await signUp();
			const adminCookie = await signInAdmin();
			const { body: created } = await placeOrder(cookie).expect(201);
			const order = created.data as { id: string };
			const patch = (status: string) =>
				http
					.patch(`/api/v1/orders/${order.id}/status`)
					.set("Cookie", adminCookie)
					.send({ status });

			await patch("PREPARING")
				.expect(200)
				.expect((res) => expect(res.body.data.status).toBe("PREPARING"));
			await patch("DELIVERED").expect(409);
			await patch("OUT_FOR_DELIVERY").expect(200);
			await patch("DELIVERED").expect(200);
			await patch("PREPARING").expect(409);
			await patch("NOPE").expect(400);
			await http
				.patch(`/api/v1/orders/${UNKNOWN_ID}/status`)
				.set("Cookie", adminCookie)
				.send({ status: "PREPARING" })
				.expect(404);
		});

		it("DELETE removes the order", async () => {
			const { cookie } = await signUp();
			const adminCookie = await signInAdmin();
			const { body: created } = await placeOrder(cookie).expect(201);
			const order = created.data as { id: string };

			await http
				.delete(`/api/v1/orders/${order.id}`)
				.set("Cookie", adminCookie)
				.expect(204);
			await http
				.get(`/api/v1/orders/${order.id}`)
				.set("Cookie", cookie)
				.expect(404);
			await http
				.delete(`/api/v1/orders/${order.id}`)
				.set("Cookie", adminCookie)
				.expect(404);
		});
	});

	describe("GET /orders/:id/events (SSE)", () => {
		it("rejects anonymous callers and hides other users' orders", async () => {
			const owner = await signUp();
			const stranger = await signUp();
			const { body: created } = await placeOrder(owner.cookie).expect(201);
			const order = created.data as { id: string };

			await http.get(`/api/v1/orders/${order.id}/events`).expect(401);
			await http
				.get(`/api/v1/orders/${order.id}/events`)
				.set("Cookie", stranger.cookie)
				.expect(404);
		});

		it("streams the current status then live updates until the order is final", async () => {
			const owner = await signUp();
			const adminCookie = await signInAdmin();
			const { body: created } = await placeOrder(owner.cookie).expect(201);
			const order = created.data as { id: string };

			const response = await fetch(`${baseUrl}/api/v1/orders/${order.id}/events`, {
				headers: { cookie: owner.cookie },
			});
			expect(response.headers.get("content-type")).toContain("text/event-stream");
			const reader = (response.body as ReadableStream<Uint8Array>).getReader();
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
				.set("Cookie", adminCookie)
				.send({ status: "CANCELLED" })
				.expect(200);
			await readUntil('"status":"CANCELLED"');
			const { done } = await reader.read(); // stream completes after the final status
			expect(done).toBe(true);
			expect(received).toContain("event: order");
		});
	});

	describe("admin websocket", () => {
		const connect = (cookie?: string) =>
			io(`${baseUrl}/admin`, {
				transports: ["websocket"],
				extraHeaders: cookie ? { cookie } : {},
				reconnection: false,
			});
		const once = <T>(socket: ReturnType<typeof io>, event: string) =>
			new Promise<T>((resolve) => socket.once(event, resolve));

		it("pushes order changes to a signed-in admin", async () => {
			const adminCookie = await signInAdmin();
			const { cookie } = await signUp();
			const socket = connect(adminCookie);
			await once(socket, "connect");
			await new Promise((resolve) => setTimeout(resolve, 50)); // let the server finish joining the admins room

			const received = once<{ type: string; order: { status: string } }>(
				socket,
				"order",
			);
			await placeOrder(cookie).expect(201);

			expect(await received).toMatchObject({
				type: "created",
				order: { status: "RECEIVED" },
			});
			socket.disconnect();
		});

		it.each([
			["no cookie", undefined],
			["a customer session", "customer"],
		])("turns away %s", async (_label, who) => {
			const cookie = who ? (await signUp()).cookie : undefined;
			const socket = connect(cookie);
			const unauthorized = once(socket, "unauthorized");
			const disconnected = once(socket, "disconnect");
			await Promise.all([unauthorized, disconnected]);
		});
	});

	describe("notifications (order -> outbox -> Kafka -> notification)", () => {
		const titles = async (cookie: string) => {
			const { body } = await http
				.get("/api/v1/notifications")
				.set("Cookie", cookie)
				.expect(200);
			return (body.data.items as Array<{ title: string }>).map((item) => item.title);
		};
		const waitForTitles = (cookie: string, expected: string[]) =>
			vi.waitFor(async () => expect(await titles(cookie)).toEqual(expected), {
				timeout: 4000,
				interval: 50,
			});

		it("requires a session", async () => {
			await http.get("/api/v1/notifications").expect(401);
			await http.get("/api/v1/notifications/stream").expect(401);
			await http.post("/api/v1/notifications/read-all").expect(401);
		});

		it("tells the customer their order was received, and nobody else", async () => {
			const customerA = await signUp();
			const customerB = await signUp();
			await placeOrder(customerA.cookie).expect(201);

			await waitForTitles(customerA.cookie, ["Order received"]);
			expect(await titles(customerB.cookie)).toEqual([]);
			expect(kafka.topic("orders.events.v1.dlq")).toHaveLength(0);
		});

		it("notifies on each status change, newest first", async () => {
			const customer = await signUp();
			const adminCookie = await signInAdmin();
			const { body: placed } = await placeOrder(customer.cookie).expect(201);
			const order = placed.data as { id: string };
			await http
				.patch(`/api/v1/orders/${order.id}/status`)
				.set("Cookie", adminCookie)
				.send({ status: "PREPARING" })
				.expect(200);

			await waitForTitles(customer.cookie, [
				"Preparing your order",
				"Order received",
			]);
		});

		it("marks notifications read one by one and all at once", async () => {
			const customer = await signUp();
			const stranger = await signUp();
			await placeOrder(customer.cookie).expect(201);
			await waitForTitles(customer.cookie, ["Order received"]);
			const { body } = await http
				.get("/api/v1/notifications")
				.set("Cookie", customer.cookie)
				.expect(200);
			expect(body.data.unreadCount).toBe(1);
			const id = body.data.items[0].id as string;

			await http
				.patch(`/api/v1/notifications/${id}/read`)
				.set("Cookie", stranger.cookie)
				.expect(404);
			await http
				.patch(`/api/v1/notifications/${id}/read`)
				.set("Cookie", customer.cookie)
				.expect(204);
			await http
				.post("/api/v1/notifications/read-all")
				.set("Cookie", customer.cookie)
				.expect(204);

			const after = await http
				.get("/api/v1/notifications")
				.set("Cookie", customer.cookie)
				.expect(200);
			expect(after.body.data.unreadCount).toBe(0);
			expect(after.body.data.items[0].read).toBe(true);
		});

		it("pushes new notifications over SSE to the owner only", async () => {
			const customer = await signUp();
			const response = await fetch(`${baseUrl}/api/v1/notifications/stream`, {
				headers: { cookie: customer.cookie },
			});
			expect(response.headers.get("content-type")).toContain("text/event-stream");
			const reader = (response.body as ReadableStream<Uint8Array>).getReader();
			const decoder = new TextDecoder();
			let received = "";
			const readUntil = async (marker: string) => {
				while (!received.includes(marker)) {
					const { value, done } = await reader.read();
					if (done) break;
					received += decoder.decode(value);
				}
			};

			await placeOrder(customer.cookie).expect(201);
			await readUntil("Order received");
			await reader.cancel();

			expect(received).toContain("event: notification");
		});

		it("dead-letters a malformed event without blocking the next one", async () => {
			const customer = await signUp();
			await kafka.producer.send([
				{ topic: "orders.events.v1", key: "bad", value: "{not json" },
			]);
			await placeOrder(customer.cookie).expect(201);

			await waitForTitles(customer.cookie, ["Order received"]);
			expect(kafka.topic("orders.events.v1.dlq")).toHaveLength(1);
		});
	});
});

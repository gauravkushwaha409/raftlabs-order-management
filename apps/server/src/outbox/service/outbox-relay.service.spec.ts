import { FakeKafka } from "../../../test/fake-kafka.js";
import { FakePrisma } from "../../../test/fakes.js";
import { ORDER_EVENTS_TOPIC } from "../../events/order-events.js";
import type { PrismaService } from "../../prisma/service/prisma.service.js";
import { OutboxRelayService } from "./outbox-relay.service.js";

function setup() {
	const prisma = new FakePrisma();
	const kafka = new FakeKafka();
	const relay = new OutboxRelayService(
		prisma as unknown as PrismaService,
		kafka.producer,
	);
	const enqueue = (id: string, aggregateId: string) =>
		prisma.outboxEvent.create({
			data: { id, type: "order.placed", aggregateId, payload: { id } },
		});
	return { prisma, kafka, relay, enqueue };
}

describe("OutboxRelayService", () => {
	it("publishes pending events in insertion order, keyed by aggregate, and clears them", async () => {
		const { prisma, kafka, relay, enqueue } = setup();
		await enqueue("e1", "order-a");
		await enqueue("e2", "order-b");
		await enqueue("e3", "order-a");

		await expect(relay.relayBatch()).resolves.toBe(3);

		expect(
			kafka.topic(ORDER_EVENTS_TOPIC).map((m) => [m.key, m.headers?.["event-id"]]),
		).toEqual([
			["order-a", "e1"],
			["order-b", "e2"],
			["order-a", "e3"],
		]);
		expect(kafka.messages[0]).toMatchObject({
			value: JSON.stringify({ id: "e1" }),
			headers: { "event-type": "order.placed" },
		});
		expect(prisma.outbox).toHaveLength(0);
	});

	it("does nothing when the outbox is empty", async () => {
		const { kafka, relay } = setup();
		await expect(relay.relayBatch()).resolves.toBe(0);
		expect(kafka.messages).toHaveLength(0);
	});

	it("keeps events for the next cycle when Kafka is unavailable", async () => {
		const { prisma, kafka, relay, enqueue } = setup();
		await enqueue("e1", "order-a");
		kafka.failSends = true;

		await expect(relay.relayBatch()).rejects.toThrow("broker unavailable");
		expect(prisma.outbox).toHaveLength(1);

		kafka.failSends = false;
		await expect(relay.relayBatch()).resolves.toBe(1);
		expect(prisma.outbox).toHaveLength(0);
	});

	it("stays idle when another relay holds the lock", async () => {
		const { prisma, kafka, relay, enqueue } = setup();
		await enqueue("e1", "order-a");
		prisma.advisoryLockGranted = false;

		await expect(relay.relayBatch()).resolves.toBe(0);
		expect(kafka.messages).toHaveLength(0);
		expect(prisma.outbox).toHaveLength(1);
	});
});

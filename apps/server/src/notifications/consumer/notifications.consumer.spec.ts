import { orderPlaced } from "../../events/order-events.js";
import { PoisonMessageError } from "../../kafka/types/kafka.types.js";
import type { NotificationsService } from "../service/notifications.service.js";
import { NotificationsConsumer } from "./notifications.consumer.js";

const message = (value: string) => ({
	topic: "orders.events.v1",
	partition: 0,
	offset: 0n,
	key: "k",
	value,
	headers: {},
});

function setup() {
	const createFromEvent = vi.fn(async () => null);
	const consumer = new NotificationsConsumer(
		{} as never,
		{ createFromEvent } as unknown as NotificationsService,
	);
	return { consumer, createFromEvent };
}

describe("NotificationsConsumer.handle", () => {
	it("hands a valid event to the notifications service", async () => {
		const { consumer, createFromEvent } = setup();
		const event = orderPlaced({
			id: "6b0c2d8e-0000-4000-8000-0000000000aa",
			userId: "6b0c2d8e-0000-4000-8000-000000000001",
			totalCents: 500,
			items: [{ quantity: 1 }],
		});
		await consumer.handle(message(JSON.stringify(event)));
		expect(createFromEvent).toHaveBeenCalledWith(event);
	});

	it("rejects non-JSON as a poison message", async () => {
		const { consumer } = setup();
		await expect(consumer.handle(message("not json"))).rejects.toBeInstanceOf(
			PoisonMessageError,
		);
	});

	it("rejects a known event type with a bad payload as a poison message", async () => {
		const { consumer } = setup();
		const bad = JSON.stringify({ type: "order.placed", id: "x", data: {} });
		await expect(consumer.handle(message(bad))).rejects.toBeInstanceOf(
			PoisonMessageError,
		);
	});

	it("skips event types it does not know instead of dead-lettering them", async () => {
		const { consumer, createFromEvent } = setup();
		const future = JSON.stringify({
			type: "order.refunded",
			version: 2,
			data: {},
		});
		await expect(consumer.handle(message(future))).resolves.toBeUndefined();
		expect(createFromEvent).not.toHaveBeenCalled();
	});
});

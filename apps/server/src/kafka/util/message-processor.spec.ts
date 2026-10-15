import {
	type ConsumedMessage,
	PoisonMessageError,
} from "../types/kafka.types.js";
import { processMessage } from "./message-processor.js";

const message: ConsumedMessage = {
	topic: "orders.events.v1",
	partition: 0,
	offset: 7n,
	key: "order-1",
	value: "{}",
	headers: {},
};
const policy = { maxAttempts: 3, backoffMs: 100 };

function setup(handler: () => Promise<void>) {
	const waits: number[] = [];
	const deadLetter = vi.fn(async () => {});
	const run = () =>
		processMessage(
			message,
			handler,
			deadLetter,
			policy,
			async (ms) => void waits.push(ms),
		);
	return { run, waits, deadLetter };
}

describe("processMessage", () => {
	it("handles a message once without dead-lettering", async () => {
		const handler = vi.fn(async () => {});
		const { run, waits, deadLetter } = setup(handler);
		await run();
		expect(handler).toHaveBeenCalledTimes(1);
		expect(waits).toEqual([]);
		expect(deadLetter).not.toHaveBeenCalled();
	});

	it("retries transient failures with doubling backoff, then succeeds", async () => {
		const handler = vi
			.fn<() => Promise<void>>()
			.mockRejectedValueOnce(new Error("db down"))
			.mockRejectedValueOnce(new Error("db down"))
			.mockResolvedValue();
		const { run, waits, deadLetter } = setup(handler);
		await run();
		expect(handler).toHaveBeenCalledTimes(3);
		expect(waits).toEqual([100, 200]);
		expect(deadLetter).not.toHaveBeenCalled();
	});

	it("dead-letters after the attempts are exhausted", async () => {
		const error = new Error("still down");
		const handler = vi.fn(async () => {
			throw error;
		});
		const { run, deadLetter } = setup(handler);
		await run();
		expect(handler).toHaveBeenCalledTimes(3);
		expect(deadLetter).toHaveBeenCalledWith(message, error, 3);
	});

	it("dead-letters poison messages immediately without retrying", async () => {
		const error = new PoisonMessageError("bad payload");
		const handler = vi.fn(async () => {
			throw error;
		});
		const { run, waits, deadLetter } = setup(handler);
		await run();
		expect(handler).toHaveBeenCalledTimes(1);
		expect(waits).toEqual([]);
		expect(deadLetter).toHaveBeenCalledWith(message, error, 1);
	});

	it("rejects when the dead-letter write fails so the offset stays uncommitted", async () => {
		const handler = vi.fn(async () => {
			throw new PoisonMessageError("bad payload");
		});
		const failure = new Error("kafka down");
		await expect(
			processMessage(
				message,
				handler,
				async () => {
					throw failure;
				},
				policy,
				async () => {},
			),
		).rejects.toBe(failure);
	});
});

import { ORDER_EVENTS_TOPIC } from "../../events/order-events.js";

export const deadLetterTopic = (topic: string) => `${topic}.dlq`;

/** Parallelism is bounded by the partition count, so `scale` marks topics that should get all configured partitions. */
export const TOPICS: ReadonlyArray<{ name: string; scale: boolean }> = [
	{ name: ORDER_EVENTS_TOPIC, scale: true },
	{ name: deadLetterTopic(ORDER_EVENTS_TOPIC), scale: false },
];

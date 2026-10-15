import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Order } from "../generated/prisma/client.js";
import { OrderStatus } from "../common/constant/order-status.js";

/**
 * Contract of the order domain events on Kafka. The `.v1` topic suffix and the envelope `version`
 * let a breaking change ship as a new topic/version while old consumers drain the old one.
 */
export const ORDER_EVENTS_TOPIC = "orders.events.v1";

const statusSchema = z.enum(
	Object.values(OrderStatus) as [OrderStatus, ...OrderStatus[]],
);

const envelope = {
	/** Unique per event: consumers use it to ignore redeliveries. */
	id: z.uuid(),
	version: z.literal(1),
	occurredAt: z.iso.datetime(),
};

export const orderEventSchema = z.discriminatedUnion("type", [
	z.object({
		...envelope,
		type: z.literal("order.placed"),
		data: z.object({
			orderId: z.uuid(),
			userId: z.uuid(),
			totalCents: z.int().nonnegative(),
			itemCount: z.int().positive(),
		}),
	}),
	z.object({
		...envelope,
		type: z.literal("order.status_changed"),
		data: z.object({
			orderId: z.uuid(),
			userId: z.uuid(),
			from: statusSchema,
			to: statusSchema,
		}),
	}),
]);

export type OrderDomainEvent = z.infer<typeof orderEventSchema>;

const KNOWN_TYPES = new Set<string>(
	orderEventSchema.options.map((option) => option.shape.type.value),
);

/** Lets a consumer skip event types added by a newer producer instead of dead-lettering them during a rolling deploy. */
export const isKnownOrderEventType = (type: unknown) =>
	typeof type === "string" && KNOWN_TYPES.has(type);

type PlacedOrder = Pick<Order, "id" | "userId" | "totalCents"> & {
	items: Array<{ quantity: number }>;
};

const envelopeFields = () => ({
	id: randomUUID(),
	version: 1 as const,
	occurredAt: new Date().toISOString(),
});

export const orderPlaced = (order: PlacedOrder): OrderDomainEvent => ({
	...envelopeFields(),
	type: "order.placed",
	data: {
		orderId: order.id,
		userId: order.userId,
		totalCents: order.totalCents,
		itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
	},
});

export const orderStatusChanged = (
	order: Pick<Order, "id" | "userId">,
	from: OrderStatus,
	to: OrderStatus,
): OrderDomainEvent => ({
	...envelopeFields(),
	type: "order.status_changed",
	data: { orderId: order.id, userId: order.userId, from, to },
});

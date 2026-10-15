import type { Prisma } from "../generated/prisma/client.js";
import type { OrderDomainEvent } from "./order-events.js";

/**
 * Records `event` in the caller's transaction. It becomes visible to the relay only if the
 * surrounding state change commits, so the DB and Kafka can never disagree about what happened.
 */
export const enqueueOrderEvent = (
	tx: Prisma.TransactionClient,
	event: OrderDomainEvent,
) =>
	tx.outboxEvent.create({
		data: {
			id: event.id,
			type: event.type,
			aggregateId: event.data.orderId,
			payload: event,
		},
	});

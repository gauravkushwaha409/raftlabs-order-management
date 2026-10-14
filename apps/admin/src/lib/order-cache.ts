import type { Order, OrderEvent } from "@/types/api";

/** Applies one live event to the cached order list (newest first). */
export function applyOrderEvent(
	orders: Order[],
	{ type, order }: OrderEvent,
): Order[] {
	switch (type) {
		case "created":
			return orders.some((existing) => existing.id === order.id)
				? orders
				: [order, ...orders];
		case "updated":
			return orders.map((existing) =>
				existing.id === order.id ? order : existing,
			);
		case "deleted":
			return orders.filter((existing) => existing.id !== order.id);
	}
}

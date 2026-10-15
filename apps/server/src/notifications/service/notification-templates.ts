import type { OrderDomainEvent } from "../../events/order-events.js";

export interface NotificationCopy {
	title: string;
	body: string;
}

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/** What the customer reads for an event, or null when the event is not worth a notification. */
export function describeEvent(
	event: OrderDomainEvent,
): NotificationCopy | null {
	if (event.type === "order.placed") {
		const { itemCount, totalCents } = event.data;
		return {
			title: "Order received",
			body: `We got your order of ${itemCount} item${itemCount === 1 ? "" : "s"} (${money(totalCents)}) and will start preparing it shortly.`,
		};
	}
	switch (event.data.to) {
		case "PREPARING":
			return {
				title: "Preparing your order",
				body: "The kitchen has started on your order.",
			};
		case "OUT_FOR_DELIVERY":
			return {
				title: "Out for delivery",
				body: "Your order is on its way.",
			};
		case "DELIVERED":
			return {
				title: "Delivered",
				body: "Your order has arrived. Enjoy your meal!",
			};
		case "CANCELLED":
			return {
				title: "Order cancelled",
				body: "Your order was cancelled.",
			};
		default:
			return null;
	}
}

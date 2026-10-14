import type { Order, OrderItem } from "../generated/prisma/client.js";
import type { OrderStatus } from "./order-status.js";

export interface OrderItemView {
	menuItemId: string;
	name: string;
	priceCents: number;
	quantity: number;
}

/** Wire format: plain JSON (ISO dates) so it survives Redis pub/sub and SSE unchanged. */
export interface OrderView {
	id: string;
	customerName: string;
	address: string;
	phone: string;
	status: OrderStatus;
	totalCents: number;
	items: OrderItemView[];
	createdAt: string;
	updatedAt: string;
}

export type OrderWithItems = Order & { items: OrderItem[] };

export const toOrderView = (order: OrderWithItems): OrderView => ({
	id: order.id,
	customerName: order.customerName,
	address: order.address,
	phone: order.phone,
	status: order.status,
	totalCents: order.totalCents,
	items: order.items.map(({ menuItemId, name, priceCents, quantity }) => ({
		menuItemId,
		name,
		priceCents,
		quantity,
	})),
	createdAt: order.createdAt.toISOString(),
	updatedAt: order.updatedAt.toISOString(),
});

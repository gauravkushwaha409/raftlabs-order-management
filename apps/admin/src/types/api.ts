export const ORDER_STATUSES = [
	"RECEIVED",
	"PREPARING",
	"OUT_FOR_DELIVERY",
	"DELIVERED",
	"CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderItem {
	menuItemId: string;
	name: string;
	priceCents: number;
	quantity: number;
}

export interface Order {
	id: string;
	customerName: string;
	address: string;
	phone: string;
	status: OrderStatus;
	totalCents: number;
	items: OrderItem[];
	createdAt: string;
	updatedAt: string;
}

export interface OrderEvent {
	type: "created" | "updated" | "deleted";
	order: Order;
}

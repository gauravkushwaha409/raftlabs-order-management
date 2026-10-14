export const ORDER_STATUSES = [
	"RECEIVED",
	"PREPARING",
	"OUT_FOR_DELIVERY",
	"DELIVERED",
	"CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface MenuItem {
	id: string;
	name: string;
	description: string;
	priceCents: number;
	image: string;
	category: string;
}

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

export interface CreateOrderInput {
	customerName: string;
	address: string;
	phone: string;
	items: Array<{ menuItemId: string; quantity: number }>;
}

export interface User {
	id: string;
	email: string;
	name: string;
	role: "CUSTOMER" | "ADMIN";
}

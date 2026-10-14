import type { OrderStatus } from "@/types/api";

export const STATUS_LABEL: Record<OrderStatus, string> = {
	RECEIVED: "Order Received",
	PREPARING: "Preparing",
	OUT_FOR_DELIVERY: "Out for Delivery",
	DELIVERED: "Delivered",
	CANCELLED: "Cancelled",
};

/** Mirrors the API's transition rules; the server stays the authority and answers 409 otherwise. */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
	RECEIVED: ["PREPARING", "CANCELLED"],
	PREPARING: ["OUT_FOR_DELIVERY", "CANCELLED"],
	OUT_FOR_DELIVERY: ["DELIVERED"],
	DELIVERED: [],
	CANCELLED: [],
};

export const STATUS_BADGE = {
	RECEIVED: "info",
	PREPARING: "warning",
	OUT_FOR_DELIVERY: "magenta",
	DELIVERED: "success",
	CANCELLED: "alert",
} as const satisfies Record<OrderStatus, string>;

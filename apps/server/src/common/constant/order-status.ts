import { OrderStatus } from "../../generated/prisma/enums.js";

export { OrderStatus };

const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
	RECEIVED: ["PREPARING", "CANCELLED"],
	PREPARING: ["OUT_FOR_DELIVERY", "CANCELLED"],
	OUT_FOR_DELIVERY: ["DELIVERED"],
	DELIVERED: [],
	CANCELLED: [],
};

/** The happy-path step the simulator takes from each status. */
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
	RECEIVED: "PREPARING",
	PREPARING: "OUT_FOR_DELIVERY",
	OUT_FOR_DELIVERY: "DELIVERED",
};

export const canTransition = (from: OrderStatus, to: OrderStatus) =>
	ALLOWED_TRANSITIONS[from].includes(to);
export const nextStatus = (from: OrderStatus) => NEXT_STATUS[from];
export const isFinalStatus = (status: OrderStatus) =>
	ALLOWED_TRANSITIONS[status].length === 0;

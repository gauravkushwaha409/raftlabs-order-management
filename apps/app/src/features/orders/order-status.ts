import type { OrderStatus } from "@/types/api";

export const PROGRESS_STEPS = [
	{ status: "RECEIVED", label: "Order Received", hint: "We've got your order" },
	{ status: "PREPARING", label: "Preparing", hint: "The kitchen is cooking" },
	{
		status: "OUT_FOR_DELIVERY",
		label: "Out for Delivery",
		hint: "On its way to you",
	},
	{ status: "DELIVERED", label: "Delivered", hint: "Enjoy your meal" },
] as const satisfies ReadonlyArray<{
	status: OrderStatus;
	label: string;
	hint: string;
}>;

export const isFinalStatus = (status: OrderStatus) =>
	status === "DELIVERED" || status === "CANCELLED";

import type { Order, OrderStatus } from "@/types/api";

// Dev/docker: same-origin via the Vite proxy. Hosted: absolute URL baked in at build time.
export const SERVER_ORIGIN = __PROXY_ENABLED__
	? window.location.origin
	: __SERVER_URL__;
const API_BASE = `${SERVER_ORIGIN}/api/v1`;

export class ApiError extends Error {
	readonly status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = "ApiError";
		this.status = status;
	}
}

async function request<T>(
	adminKey: string,
	path: string,
	init?: RequestInit,
): Promise<T> {
	const response = await fetch(`${API_BASE}${path}`, {
		...init,
		headers: {
			"content-type": "application/json",
			"x-admin-key": adminKey,
			...init?.headers,
		},
	});
	if (!response.ok) {
		const body = (await response.json().catch(() => null)) as {
			message?: unknown;
		} | null;
		const message =
			typeof body?.message === "string"
				? body.message
				: `Request failed (${response.status})`;
		throw new ApiError(message, response.status);
	}
	return response.status === 204
		? (undefined as T)
		: (response.json() as Promise<T>);
}

export const listOrders = (adminKey: string) =>
	request<Order[]>(adminKey, "/orders?limit=100");
export const updateOrderStatus = (
	adminKey: string,
	id: string,
	status: OrderStatus,
) =>
	request<Order>(adminKey, `/orders/${id}/status`, {
		method: "PATCH",
		body: JSON.stringify({ status }),
	});
export const deleteOrder = (adminKey: string, id: string) =>
	request<void>(adminKey, `/orders/${id}`, { method: "DELETE" });

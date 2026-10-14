import type { CreateOrderInput, MenuItem, Order } from "@/types/api";

// Dev/docker: same-origin via the Vite proxy. Hosted: absolute URL baked in at build time.
const API_BASE = __PROXY_ENABLED__ ? "/api/v1" : `${__SERVER_URL__}/api/v1`;

export class ApiError extends Error {
	readonly status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = "ApiError";
		this.status = status;
	}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(`${API_BASE}${path}`, {
		...init,
		headers: { "content-type": "application/json", ...init?.headers },
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
	return response.json() as Promise<T>;
}

export const getMenu = () => request<MenuItem[]>("/menu");
export const getOrder = (id: string) => request<Order>(`/orders/${id}`);
export const createOrder = (input: CreateOrderInput) =>
	request<Order>("/orders", { method: "POST", body: JSON.stringify(input) });

export const orderEventsUrl = (id: string) => `${API_BASE}/orders/${id}/events`;

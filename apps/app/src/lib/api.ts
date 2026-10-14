import type { CreateOrderInput, MenuItem, Order, User } from "@/types/api";

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
		credentials: "include", // the session lives in an httpOnly cookie
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
	if (response.status === 204) return undefined as T;
	const body = (await response.json()) as { success: true; data: T } | T;
	// The API wraps every payload in { success, statusCode, message, data }.
	return typeof body === "object" &&
		body !== null &&
		(body as { success?: unknown }).success === true &&
		"data" in body
		? (body as { data: T }).data
		: (body as T);
}

export const register = (input: {
	name: string;
	email: string;
	password: string;
}) =>
	request<User>("/auth/register", {
		method: "POST",
		body: JSON.stringify(input),
	});
export const login = (input: { email: string; password: string }) =>
	request<User>("/auth/login", { method: "POST", body: JSON.stringify(input) });
export const logout = () => request<void>("/auth/logout", { method: "POST" });

/** The signed-in user, or null for visitors. */
export const getMe = () =>
	request<User>("/auth/me").catch((error: unknown) => {
		if (error instanceof ApiError && error.status === 401) return null;
		throw error;
	});

export const getMenu = () => request<MenuItem[]>("/menu");
export const getMyOrders = () => request<Order[]>("/orders/mine");
export const getOrder = (id: string) => request<Order>(`/orders/${id}`);
export const createOrder = (input: CreateOrderInput) =>
	request<Order>("/orders", { method: "POST", body: JSON.stringify(input) });

export const orderEventsUrl = (id: string) => `${API_BASE}/orders/${id}/events`;

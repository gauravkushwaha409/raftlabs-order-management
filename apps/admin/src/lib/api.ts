import type { MenuItem, MenuItemInput, Order, OrderStatus, User } from "@/types/api";

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
	return response.status === 204
		? (undefined as T)
		: (response.json() as Promise<T>);
}

export const login = (input: { email: string; password: string }) =>
	request<User>("/auth/login", { method: "POST", body: JSON.stringify(input) });
export const logout = () => request<void>("/auth/logout", { method: "POST" });

/** The signed-in user, or null for visitors. */
export const getMe = () =>
	request<User>("/auth/me").catch((error: unknown) => {
		if (error instanceof ApiError && error.status === 401) return null;
		throw error;
	});

export const listOrders = () => request<Order[]>("/orders?limit=100");
export const updateOrderStatus = (id: string, status: OrderStatus) =>
	request<Order>(`/orders/${id}/status`, {
		method: "PATCH",
		body: JSON.stringify({ status }),
	});
export const deleteOrder = (id: string) =>
	request<void>(`/orders/${id}`, { method: "DELETE" });

export const listMenuItems = () => request<MenuItem[]>("/menu/all");
export const createMenuItem = (input: MenuItemInput) =>
	request<MenuItem>("/menu", { method: "POST", body: JSON.stringify(input) });
export const updateMenuItem = (id: string, input: Partial<MenuItemInput>) =>
	request<MenuItem>(`/menu/${id}`, {
		method: "PATCH",
		body: JSON.stringify(input),
	});
export const deleteMenuItem = (id: string) =>
	request<void>(`/menu/${id}`, { method: "DELETE" });

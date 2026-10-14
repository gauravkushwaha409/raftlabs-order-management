/** Every backend route, in one place. Services build on these; nothing else hardcodes a path. */
export const ENDPOINTS = {
	AUTH: {
		REGISTER: "/auth/register",
		LOGIN: "/auth/login",
		LOGOUT: "/auth/logout",
		ME: "/auth/me",
	},
	MENU: {
		LIST: "/menu",
	},
	ORDERS: {
		CREATE: "/orders",
		MINE: "/orders/mine",
		DETAIL: (orderId: string) => `/orders/${orderId}`,
		EVENTS: (orderId: string) => `/orders/${orderId}/events`,
	},
} as const;

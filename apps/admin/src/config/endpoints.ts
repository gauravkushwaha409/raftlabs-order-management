/** Every backend route, in one place. Services build on these; nothing else hardcodes a path. */
export const ENDPOINTS = {
	AUTH: {
		LOGIN: "/auth/login",
		LOGOUT: "/auth/logout",
		ME: "/auth/me",
	},
	ORDERS: {
		LIST: "/orders?limit=100",
		STATUS: (orderId: string) => `/orders/${orderId}/status`,
		DETAIL: (orderId: string) => `/orders/${orderId}`,
	},
	MENU: {
		ALL: "/menu/all",
		CREATE: "/menu",
		DETAIL: (itemId: string) => `/menu/${itemId}`,
	},
} as const;

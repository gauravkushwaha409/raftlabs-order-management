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
	NOTIFICATIONS: {
		LIST: "/notifications",
		STREAM: "/notifications/stream",
		READ: (notificationId: string) => `/notifications/${notificationId}/read`,
		READ_ALL: "/notifications/read-all",
	},
	ORDERS: {
		CREATE: "/orders",
		MINE: "/orders/mine",
		DETAIL: (orderId: string) => `/orders/${orderId}`,
		EVENTS: (orderId: string) => `/orders/${orderId}/events`,
	},
} as const;

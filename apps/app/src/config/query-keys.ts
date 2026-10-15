/** TanStack Query keys, in one place. Feature hooks build on these. */
export const QUERY_KEYS = {
	AUTH: {
		ME: ["me"] as const,
	},
	MENU: {
		ALL: ["menu"] as const,
	},
	NOTIFICATIONS: {
		FEED: ["notifications"] as const,
	},
	ORDERS: {
		MINE: ["orders", "mine"] as const,
		DETAIL: (orderId: string) => ["order", orderId] as const,
	},
} as const;

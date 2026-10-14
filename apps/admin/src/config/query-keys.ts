/** TanStack Query keys, in one place. Feature hooks build on these. */
export const QUERY_KEYS = {
	AUTH: {
		ME: ["me"] as const,
	},
	ORDERS: {
		ALL: ["orders"] as const,
	},
	MENU: {
		ALL: ["menu-items"] as const,
	},
} as const;

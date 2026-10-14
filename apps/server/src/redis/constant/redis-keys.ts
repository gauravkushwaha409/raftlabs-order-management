/**
 * Every Redis channel and key, in one place. Services build on these;
 * nothing else hardcodes a channel or key string.
 */
export const REDIS_CHANNELS = {
	/** Order lifecycle events fanned out to every instance (SSE, admin socket, simulator). */
	ORDER_EVENTS: "orders:events",
} as const;

/** Cache key builders. Parameters are embedded so filtered reads never collide. */
export const REDIS_KEYS = {
	/** Authenticated user snapshot for session validation (`/auth/me`, guards, gateway). */
	SESSION_USER: (userId: string) => `session:user:${userId}`,
	/** Public menu list. Invalidated by every admin menu write. */
	MENU_LIST: "menu:list",
	/** Order detail (view + owner) for tracking reads. Invalidated by every order write. */
	ORDER_DETAIL: (orderId: string) => `order:${orderId}`,
} as const;

/** Time-to-live, in seconds. Short on purpose: the cache is a fast lane, the DB stays the authority. */
export const REDIS_TTL_SECONDS = {
	SESSION_USER: 60,
	MENU_LIST: 300,
	ORDER_DETAIL: 30,
} as const;

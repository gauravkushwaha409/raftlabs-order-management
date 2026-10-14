/**
 * Every Redis channel and key, in one place. Services build on these;
 * nothing else hardcodes a channel or key string.
 */
export const REDIS_CHANNELS = {
	/** Order lifecycle events fanned out to every instance (SSE, admin socket, simulator). */
	ORDER_EVENTS: "orders:events",
} as const;

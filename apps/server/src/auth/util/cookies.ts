import type { CookieOptions } from "express";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Reads one cookie from a raw Cookie header (works for HTTP requests and socket.io handshakes alike). */
export function readCookie(
	header: string | undefined,
	name: string,
): string | undefined {
	for (const part of header?.split(";") ?? []) {
		const separator = part.indexOf("=");
		if (separator > 0 && part.slice(0, separator).trim() === name) {
			try {
				return decodeURIComponent(part.slice(separator + 1).trim());
			} catch {
				return undefined;
			}
		}
	}
	return undefined;
}

/**
 * Same-site deployments use `lax`. When the apps and the API live on different sites set
 * COOKIE_SAME_SITE=none (forces `secure`); the CORS allow-list then decides who may call the API.
 */
export function sessionCookieOptions(): CookieOptions {
	const sameSite = (process.env.COOKIE_SAME_SITE ?? "lax") as
		| "lax"
		| "strict"
		| "none";
	return {
		httpOnly: true,
		sameSite,
		secure: sameSite === "none" || process.env.NODE_ENV === "production",
		path: "/",
		maxAge: SEVEN_DAYS_MS,
	};
}

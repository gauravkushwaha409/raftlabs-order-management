import { createHash, timingSafeEqual } from "node:crypto";

const digest = (value: string) => createHash("sha256").update(value).digest();

/** Constant-time check against ADMIN_API_KEY. Denies everything when the key is not configured. */
export function isValidAdminKey(candidate: unknown): boolean {
	const expected = process.env.ADMIN_API_KEY;
	if (!expected || typeof candidate !== "string") return false;
	return timingSafeEqual(digest(candidate), digest(expected));
}

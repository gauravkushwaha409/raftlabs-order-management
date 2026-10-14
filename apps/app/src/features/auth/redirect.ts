/** Only same-origin paths may be used as a post-login target; anything else (https://evil.test, //evil.test) falls back. */
export function safeRedirect(
	target: string | undefined,
	fallback = "/",
): string {
	if (
		!target ||
		!target.startsWith("/") ||
		target.startsWith("//") ||
		target.includes("\\")
	)
		return fallback;
	return target;
}

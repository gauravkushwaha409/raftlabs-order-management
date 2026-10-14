/** Shared JWT secret. Must be at least 32 characters in every environment. */
export function jwtSecret(): string {
	const secret = process.env.JWT_SECRET;
	if (!secret || secret.length < 32)
		throw new Error("JWT_SECRET must be set to at least 32 characters");
	return secret;
}

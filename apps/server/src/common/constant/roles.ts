/**
 * Account roles, in one place. Services, guards and the seed script build on
 * these; nothing else hardcodes a role string. Keep in sync with the `Role`
 * enum in `prisma/schema.prisma`, which is the database-level definition.
 */
export const ROLES = {
	ADMIN: "ADMIN",
	CUSTOMER: "CUSTOMER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

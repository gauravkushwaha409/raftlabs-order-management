import type { Request } from "express";
import type { Role } from "../generated/prisma/enums.js";

export interface AuthUser {
	id: string;
	email: string;
	name: string;
	role: Role;
}

export type AuthenticatedRequest = Request & { user: AuthUser };

export const ACCESS_COOKIE = "access_token";

import type { ApiResponse } from "@package/api-client";
import type { User } from "@/types/api";

export namespace AuthTypes {
	export interface LoginPayload {
		email: string;
		password: string;
	}

	/** Wire shape of POST /auth/login. Unwrap with `response.data.data`. */
	export type LoginResponse = ApiResponse<User>;

	/** Wire shape of POST /auth/logout (204, no payload). */
	export type LogoutResponse = ApiResponse<null>;

	/** Wire shape of GET /auth/me. Unwrap with `response.data.data`. */
	export type SessionResponse = ApiResponse<User>;
}

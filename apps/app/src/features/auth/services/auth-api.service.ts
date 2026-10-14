import { ApiError, BaseApiService } from "@package/api-client";
import { ENDPOINTS } from "@/config/endpoints";
import { apiClient } from "@/lib/api-client";
import type { User } from "@/types/api";
import type { AuthTypes } from "../types/auth-api.types";

class AuthApiService extends BaseApiService {
	async register(
		payload: AuthTypes.RegisterPayload,
	): Promise<AuthTypes.RegisterResponse> {
		return super.post<User>(ENDPOINTS.AUTH.REGISTER, payload);
	}

	async login(
		payload: AuthTypes.LoginPayload,
	): Promise<AuthTypes.LoginResponse> {
		return super.post<User>(ENDPOINTS.AUTH.LOGIN, payload);
	}

	async logout(): Promise<AuthTypes.LogoutResponse> {
		return super.post<null>(ENDPOINTS.AUTH.LOGOUT);
	}

	async getMe(): Promise<User | null> {
		try {
			const response = await super.get<User>(ENDPOINTS.AUTH.ME);
			return response.data.data;
		} catch (error) {
			// Visitors are not an error state for callers.
			if (error instanceof ApiError && error.status === 401) return null;
			throw error;
		}
	}
}

export const authApiService = new AuthApiService(apiClient);

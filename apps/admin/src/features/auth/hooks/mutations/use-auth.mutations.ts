import type { ApiError, ApiResponse } from "@package/api-client";
import { useMutation } from "@package/query";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/config/query-keys";
import type { User } from "@/types/api";
import { authApiService } from "../../services/auth-api.service";
import type { AuthTypes } from "../../types/auth-api.types";

export function useLoginMutation() {
	const queryClient = useQueryClient();
	return useMutation<AuthTypes.LoginResponse, ApiError, AuthTypes.LoginPayload>(
		async (credentials) => {
			const response = await authApiService.login(credentials);
			const user: User = response.data.data;
			if (user.role !== "ADMIN") {
				await authApiService.logout(); // do not leave a customer session behind
				throw new Error("This account does not have admin access");
			}
			return response;
		},
		{
			onSuccess: (response) => {
				queryClient.setQueryData([...QUERY_KEYS.AUTH.ME], response.data.data);
			},
		},
	);
}

export function useLogoutMutation() {
	const queryClient = useQueryClient();
	return useMutation<ApiResponse<null>, ApiError, void>(
		() => authApiService.logout(),
		{
			onSettled: () => {
				queryClient.clear();
				queryClient.setQueryData([...QUERY_KEYS.AUTH.ME], null);
			},
		},
	);
}

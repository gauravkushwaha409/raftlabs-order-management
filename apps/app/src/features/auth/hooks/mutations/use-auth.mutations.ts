import type { ApiError, ApiResponse } from "@package/api-client";
import { useMutation } from "@package/query";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { QUERY_KEYS } from "@/config/query-keys";
import type { User } from "@/types/api";
import { safeRedirect } from "../../redirect";
import { authApiService } from "../../services/auth-api.service";
import type { AuthTypes } from "../../types/auth-api.types";

/** Stores the user in the session cache, then goes where the visitor was headed. */
function useOnAuthenticated(redirectTo: string | undefined) {
	const queryClient = useQueryClient();
	const router = useRouter();
	return (user: User) => {
		queryClient.setQueryData([...QUERY_KEYS.AUTH.ME], user);
		router.history.push(safeRedirect(redirectTo));
	};
}

export function useLoginMutation(redirectTo: string | undefined) {
	const onAuthenticated = useOnAuthenticated(redirectTo);
	return useMutation<AuthTypes.LoginResponse, ApiError, AuthTypes.LoginPayload>(
		(payload) => authApiService.login(payload),
		{
			onSuccess: (response) => {
				const user = response.data?.data;
				if (!user) return;
				onAuthenticated(user);
			},
		},
	);
}

export function useRegisterMutation(redirectTo: string | undefined) {
	const onAuthenticated = useOnAuthenticated(redirectTo);
	return useMutation<
		AuthTypes.RegisterResponse,
		ApiError,
		AuthTypes.RegisterPayload
	>((payload) => authApiService.register(payload), {
		onSuccess: (response) => {
			const user = response.data?.data;
			if (!user) return;
			onAuthenticated(user);
		},
	});
}

export function useLogoutMutation() {
	const queryClient = useQueryClient();
	const router = useRouter();
	return useMutation<ApiResponse<null>, ApiError, void>(
		() => authApiService.logout(),
		{
			onSuccess: () => {
				queryClient.clear(); // drop every cached order and the session
				queryClient.setQueryData([...QUERY_KEYS.AUTH.ME], null);
				router.history.push("/");
			},
		},
	);
}

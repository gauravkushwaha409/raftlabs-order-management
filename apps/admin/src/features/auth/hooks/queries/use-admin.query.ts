import { ApiError } from "@package/api-client";
import { useQuery } from "@package/query";
import { QUERY_KEYS } from "@/config/query-keys";
import type { User } from "@/types/api";
import { authApiService } from "../../services/auth-api.service";

const SESSION_STALE_MS = 60_000;

/** The signed-in admin, or null. A signed-in customer counts as nobody: this app is admin-only. */
export const useAdminQuery = () =>
	useQuery<User | null, ApiError, User | null>(
		[...QUERY_KEYS.AUTH.ME],
		authApiService.getMe.bind(authApiService),
		undefined,
		{
			staleTime: SESSION_STALE_MS,
			select: (user) => (user?.role === "ADMIN" ? user : null),
		},
	);

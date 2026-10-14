/**
 * Back-compat facades over the feature hooks (`hooks/queries|mutations`).
 * New code should import the hooks directly; these aliases keep existing
 * callers (routes, menus, pages) untouched.
 */
import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { QUERY_KEYS } from "@/config/query-keys";
import {
	useLoginMutation,
	useLogoutMutation,
	useRegisterMutation,
} from "./hooks/mutations/use-auth.mutations";
import { useMeQuery } from "./hooks/queries/use-me.query";
import { authApiService } from "./services/auth-api.service";

export const useMe = useMeQuery;
export const useLogin = useLoginMutation;
export const useRegister = useRegisterMutation;
export const useLogout = useLogoutMutation;

export const fetchMe = (queryClient: QueryClient) =>
	queryClient.fetchQuery({
		queryKey: [...QUERY_KEYS.AUTH.ME],
		queryFn: () => authApiService.getMe(),
		staleTime: 60_000,
	});

/** Route guard: visitors are sent to the login page and brought back afterwards. */
export async function requireAuth({
	context,
	location,
}: {
	context: { queryClient: QueryClient };
	location: { href: string };
}) {
	if (!(await fetchMe(context.queryClient)))
		throw redirect({ to: "/login", search: { redirect: location.href } });
}

/** Route guard for login/register: signed-in users have nothing to do there. */
export async function redirectIfSignedIn({
	context,
}: {
	context: { queryClient: QueryClient };
}) {
	if (await fetchMe(context.queryClient)) throw redirect({ to: "/" });
}

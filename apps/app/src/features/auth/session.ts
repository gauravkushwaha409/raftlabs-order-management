import { useMutation, useQuery } from "@package/query";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { redirect, useRouter } from "@tanstack/react-router";
import { getMe, login, logout, register } from "@/lib/api";
import type { User } from "@/types/api";
import { safeRedirect } from "./redirect";

const ME_KEY = ["me"];
const SESSION_STALE_MS = 60_000;

export const fetchMe = (queryClient: QueryClient) =>
	queryClient.fetchQuery({
		queryKey: ME_KEY,
		queryFn: getMe,
		staleTime: SESSION_STALE_MS,
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

export const useMe = () =>
	useQuery<User | null>(ME_KEY, getMe, undefined, {
		staleTime: SESSION_STALE_MS,
	});

/** Stores the user in the session cache, then goes where the visitor was headed. */
function useOnAuthenticated(redirectTo: string | undefined) {
	const queryClient = useQueryClient();
	const router = useRouter();
	return (user: User) => {
		queryClient.setQueryData(ME_KEY, user);
		router.history.push(safeRedirect(redirectTo));
	};
}

export const useLogin = (redirectTo: string | undefined) =>
	useMutation(login, { onSuccess: useOnAuthenticated(redirectTo) });
export const useRegister = (redirectTo: string | undefined) =>
	useMutation(register, { onSuccess: useOnAuthenticated(redirectTo) });

export function useLogout() {
	const queryClient = useQueryClient();
	const router = useRouter();
	return useMutation(logout, {
		onSuccess: () => {
			queryClient.clear(); // drop every cached order and the session
			queryClient.setQueryData(ME_KEY, null);
			router.history.push("/");
		},
	});
}

import { useMutation, useQuery } from "@package/query";
import { useQueryClient } from "@tanstack/react-query";
import { getMe, login, logout } from "@/lib/api";
import type { User } from "@/types/api";

const ME_KEY = ["me"];

/** The signed-in admin, or null. A signed-in customer counts as nobody: this app is admin-only. */
export const useAdmin = () =>
	useQuery<User | null, Error, User | null>(ME_KEY, getMe, undefined, {
		staleTime: 60_000,
		select: (user) => (user?.role === "ADMIN" ? user : null),
	});

export function useLogin() {
	const queryClient = useQueryClient();
	return useMutation(
		async (credentials: { email: string; password: string }) => {
			const user = await login(credentials);
			if (user.role !== "ADMIN") {
				await logout(); // do not leave a customer session behind
				throw new Error("This account does not have admin access");
			}
			return user;
		},
		{ onSuccess: (user: User) => queryClient.setQueryData(ME_KEY, user) },
	);
}

export function useLogout() {
	const queryClient = useQueryClient();
	return useMutation(logout, {
		onSettled: () => {
			queryClient.clear();
			queryClient.setQueryData(ME_KEY, null);
		},
	});
}

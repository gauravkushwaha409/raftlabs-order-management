import { ApiError } from "@package/api-client";
import { useMutation } from "@package/query";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/config/query-keys";
import type { MenuItem } from "@/types/api";
import { menuApiService } from "../../services/menu-api.service";
import type { MenuTypes } from "../../types/menu-api.types";

const upsertInCache = (queryClient: QueryClient, saved: MenuItem) =>
	queryClient.setQueryData<MenuItem[]>([...QUERY_KEYS.MENU.ALL], (cached) => {
		if (!cached) return [saved];
		if (cached.some((entry) => entry.id === saved.id))
			return cached.map((entry) => (entry.id === saved.id ? saved : entry));
		return [...cached, saved];
	});

const removeFromCache = (queryClient: QueryClient, deleted: MenuItem) =>
	queryClient.setQueryData<MenuItem[]>([...QUERY_KEYS.MENU.ALL], (cached) =>
		cached?.filter((entry) => entry.id !== deleted.id),
	);

export const signOutIfUnauthorized =
	(signOut: () => void) => (error: Error | null) => {
		if (
			error instanceof ApiError &&
			(error.status === 401 || error.status === 403)
		)
			signOut();
	};

export function useSaveMenuItemMutation(signOut: () => void) {
	const queryClient = useQueryClient();
	return useMutation<MenuTypes.SaveResponse, ApiError, MenuTypes.SavePayload>(
		({ item, input }) =>
			item
				? menuApiService.updateMenuItem(item.id, input)
				: menuApiService.createMenuItem(input),
		{
			onSuccess: (response) => {
				const saved = response.data?.data;
				if (!saved) return;
				upsertInCache(queryClient, saved);
			},
			onError: signOutIfUnauthorized(signOut),
		},
	);
}

export function useDeleteMenuItemMutation(signOut: () => void) {
	const queryClient = useQueryClient();
	return useMutation<void, ApiError, MenuItem>(
		(item: MenuItem) => menuApiService.deleteMenuItem(item.id),
		{
			onSuccess: (_data, item) => removeFromCache(queryClient, item),
			onError: signOutIfUnauthorized(signOut),
		},
	);
}

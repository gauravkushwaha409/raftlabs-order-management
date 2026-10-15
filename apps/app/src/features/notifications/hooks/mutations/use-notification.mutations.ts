import type { ApiError } from "@package/api-client";
import { useMutation } from "@package/query";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/config/query-keys";
import type { NotificationFeed } from "@/types/api";
import { withAllRead, withRead } from "../../notification-feed";
import { notificationsApiService } from "../../services/notifications-api.service";

/**
 * Optimistic: the badge drops immediately; a failed request refetches the real feed.
 */
function useFeedUpdater() {
	const queryClient = useQueryClient();
	const key = [...QUERY_KEYS.NOTIFICATIONS.FEED];
	return {
		apply: (update: (feed?: NotificationFeed) => NotificationFeed) =>
			queryClient.setQueryData<NotificationFeed>(key, update),
		resync: () => queryClient.invalidateQueries({ queryKey: key }),
	};
}

export function useMarkNotificationReadMutation() {
	const { apply, resync } = useFeedUpdater();
	return useMutation<unknown, ApiError, string>(
		(id) => notificationsApiService.markRead(id),
		{
			onMutate: (id) => apply((feed) => withRead(feed, id)),
			onError: resync,
		},
	);
}

export function useMarkAllNotificationsReadMutation() {
	const { apply, resync } = useFeedUpdater();
	return useMutation<unknown, ApiError, void>(
		() => notificationsApiService.markAllRead(),
		{
			onMutate: () => apply(withAllRead),
			onError: resync,
		},
	);
}

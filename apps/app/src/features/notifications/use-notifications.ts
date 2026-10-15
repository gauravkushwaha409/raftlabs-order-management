import { toast } from "@package/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { QUERY_KEYS } from "@/config/query-keys";
import { notificationsStreamUrl } from "@/lib/api-client";
import type { Notification, NotificationFeed } from "@/types/api";
import {
	useMarkAllNotificationsReadMutation,
	useMarkNotificationReadMutation,
} from "./hooks/mutations/use-notification.mutations";
import { useNotificationFeedQuery } from "./hooks/queries/use-notification.queries";
import { EMPTY_FEED, withNotification } from "./notification-feed";

/**
 * The signed-in user's notifications: the REST read gives the first paint, then a Server-Sent
 * Events stream pushes new ones into the same cache entry (and raises a toast).
 */
export function useNotifications() {
	const queryClient = useQueryClient();
	const feed = useNotificationFeedQuery();
	const markRead = useMarkNotificationReadMutation();
	const markAllRead = useMarkAllNotificationsReadMutation();

	useEffect(() => {
		const source = new EventSource(notificationsStreamUrl(), {
			withCredentials: true,
		});
		source.addEventListener("notification", (event) => {
			const notification = JSON.parse(
				(event as MessageEvent<string>).data,
			) as Notification;
			queryClient.setQueryData<NotificationFeed>(
				[...QUERY_KEYS.NOTIFICATIONS.FEED],
				(current) => withNotification(current, notification),
			);
			toast(notification.title, { description: notification.body });
		});
		return () => source.close(); // EventSource reconnects on its own after drops
	}, [queryClient]);

	return {
		feed: feed.data ?? EMPTY_FEED,
		isPending: feed.isPending,
		markRead: markRead.mutate,
		markAllRead: () => markAllRead.mutate(),
	};
}

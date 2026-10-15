import type { ApiError } from "@package/api-client";
import { useQuery } from "@package/query";
import { QUERY_KEYS } from "@/config/query-keys";
import type { NotificationFeed } from "@/types/api";
import { notificationsApiService } from "../../services/notifications-api.service";

export const useNotificationFeedQuery = () =>
	useQuery<NotificationFeed, ApiError, NotificationFeed>(
		[...QUERY_KEYS.NOTIFICATIONS.FEED],
		() =>
			notificationsApiService.getFeed().then((response) => response.data.data),
		undefined,
		{ staleTime: 0, refetchOnMount: "always" },
	);

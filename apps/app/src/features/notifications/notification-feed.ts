import type { Notification, NotificationFeed } from "@/types/api";

export const EMPTY_FEED: NotificationFeed = { items: [], unreadCount: 0 };

/** A pushed notification goes on top; one already in the feed (e.g. fetched while it was in flight) is ignored. */
export function withNotification(
	feed: NotificationFeed = EMPTY_FEED,
	notification: Notification,
): NotificationFeed {
	if (feed.items.some((item) => item.id === notification.id)) return feed;
	return {
		items: [notification, ...feed.items],
		unreadCount: feed.unreadCount + (notification.read ? 0 : 1),
	};
}

export function withRead(
	feed: NotificationFeed = EMPTY_FEED,
	id: string,
): NotificationFeed {
	const target = feed.items.find((item) => item.id === id);
	if (!target || target.read) return feed;
	return {
		items: feed.items.map((item) =>
			item.id === id ? { ...item, read: true } : item,
		),
		unreadCount: Math.max(0, feed.unreadCount - 1),
	};
}

export const withAllRead = (
	feed: NotificationFeed = EMPTY_FEED,
): NotificationFeed => ({
	items: feed.items.map((item) => ({ ...item, read: true })),
	unreadCount: 0,
});

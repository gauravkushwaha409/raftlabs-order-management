import type { Notification } from "@/types/api";
import {
	EMPTY_FEED,
	withAllRead,
	withNotification,
	withRead,
} from "./notification-feed";

const note = (id: string, read = false): Notification => ({
	id,
	orderId: "o1",
	title: `Title ${id}`,
	body: "Body",
	read,
	createdAt: "2026-10-15T10:00:00.000Z",
});

describe("notification feed", () => {
	it("puts a pushed notification on top and counts it as unread", () => {
		const feed = withNotification(
			withNotification(EMPTY_FEED, note("a")),
			note("b"),
		);
		expect(feed.items.map((item) => item.id)).toEqual(["b", "a"]);
		expect(feed.unreadCount).toBe(2);
	});

	it("ignores a notification it already has", () => {
		const feed = withNotification(EMPTY_FEED, note("a"));
		expect(withNotification(feed, note("a"))).toBe(feed);
	});

	it("marks one notification read and lowers the unread count once", () => {
		const feed = withNotification(
			withNotification(EMPTY_FEED, note("a")),
			note("b"),
		);
		const after = withRead(feed, "a");
		expect(after.items.find((item) => item.id === "a")?.read).toBe(true);
		expect(after.unreadCount).toBe(1);
		expect(withRead(after, "a")).toBe(after); // already read: no further decrement
		expect(withRead(after, "missing")).toBe(after);
	});

	it("marks everything read", () => {
		const feed = withNotification(
			withNotification(EMPTY_FEED, note("a")),
			note("b"),
		);
		const after = withAllRead(feed);
		expect(after.unreadCount).toBe(0);
		expect(after.items.every((item) => item.read)).toBe(true);
	});
});

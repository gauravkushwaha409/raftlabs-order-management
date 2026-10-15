import type { Notification } from "../../generated/prisma/client.js";

/** Wire format: plain JSON so it survives Redis pub/sub and SSE unchanged. */
export interface NotificationView {
	id: string;
	orderId: string;
	title: string;
	body: string;
	read: boolean;
	createdAt: string;
}

export const toNotificationView = (row: Notification): NotificationView => ({
	id: row.id,
	orderId: row.orderId,
	title: row.title,
	body: row.body,
	read: row.readAt !== null,
	createdAt: row.createdAt.toISOString(),
});

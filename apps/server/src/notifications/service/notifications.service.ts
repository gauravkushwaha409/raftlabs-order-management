import { Injectable, NotFoundException } from "@nestjs/common";
import type { OrderDomainEvent } from "../../events/order-events.js";
import { PrismaService } from "../../prisma/service/prisma.service.js";
import {
	type NotificationView,
	toNotificationView,
} from "../dto/notification.view.js";
import { NotificationEventsService } from "./notification-events.service.js";
import { describeEvent } from "./notification-templates.js";

const LIST_LIMIT = 50;

@Injectable()
export class NotificationsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly live: NotificationEventsService,
	) {}

	/**
	 * Idempotent: the unique `eventId` turns a redelivered Kafka message into a no-op, so the
	 * customer is notified once however often the event is processed.
	 */
	async createFromEvent(
		event: OrderDomainEvent,
	): Promise<NotificationView | null> {
		const copy = describeEvent(event);
		if (!copy) return null;
		try {
			const row = await this.prisma.notification.create({
				data: {
					eventId: event.id,
					userId: event.data.userId,
					orderId: event.data.orderId,
					...copy,
				},
			});
			const notification = toNotificationView(row);
			await this.live.publish({ userId: row.userId, notification });
			return notification;
		} catch (error) {
			if ((error as { code?: string }).code === "P2002") return null; // already processed
			throw error;
		}
	}

	async list(userId: string) {
		const [rows, unreadCount] = await Promise.all([
			this.prisma.notification.findMany({
				where: { userId },
				orderBy: { createdAt: "desc" },
				take: LIST_LIMIT,
			}),
			this.prisma.notification.count({ where: { userId, readAt: null } }),
		]);
		return { items: rows.map(toNotificationView), unreadCount };
	}

	async markRead(userId: string, id: string): Promise<void> {
		const { count } = await this.prisma.notification.updateMany({
			where: { id, userId }, // someone else's notification is a 404, like a missing one
			data: { readAt: new Date() },
		});
		if (count === 0) throw new NotFoundException(`Notification ${id} not found`);
	}

	async markAllRead(userId: string): Promise<void> {
		await this.prisma.notification.updateMany({
			where: { userId, readAt: null },
			data: { readAt: new Date() },
		});
	}
}

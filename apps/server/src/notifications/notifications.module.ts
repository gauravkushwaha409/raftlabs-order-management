import { Module } from "@nestjs/common";
import { NotificationEventsService } from "./service/notification-events.service.js";
import { NotificationsService } from "./service/notifications.service.js";

/** Notification storage and live fan-out, shared by the API and the worker (neither needs the other's auth/Kafka). */
@Module({
	providers: [NotificationsService, NotificationEventsService],
	exports: [NotificationsService, NotificationEventsService],
})
export class NotificationsModule {}

import { Injectable } from "@nestjs/common";
import { RedisChannel } from "../redis/redis-channel.js";
import type { NotificationView } from "./notification.view.js";

export interface NotificationEvent {
	userId: string;
	notification: NotificationView;
}

/** Carries notifications from the worker that created them to the API instance holding the user's stream. */
@Injectable()
export class NotificationEventsService extends RedisChannel<NotificationEvent> {
	protected readonly channel = "notifications:events";
}

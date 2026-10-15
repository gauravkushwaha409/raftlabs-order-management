import {
	Controller,
	Get,
	HttpCode,
	type MessageEvent,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	Sse,
	UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { filter, interval, map, merge, type Observable } from "rxjs";
import { CurrentUser } from "../../auth/decorator/current-user.decorator.js";
import { AuthGuard } from "../../auth/guard/auth.guard.js";
import { ACCESS_COOKIE, type AuthUser } from "../../auth/types/auth.types.js";
import { NotificationEventsService } from "../service/notification-events.service.js";
import { NotificationsService } from "../service/notifications.service.js";

const KEEP_ALIVE_MS = 25_000;

@ApiTags("Notifications")
@ApiCookieAuth(ACCESS_COOKIE)
@UseGuards(AuthGuard)
@Controller("notifications")
export class NotificationsController {
	constructor(
		private readonly notifications: NotificationsService,
		private readonly live: NotificationEventsService,
	) {}

	/** Latest notifications of the signed-in user and how many are unread. */
	@Get()
	list(@CurrentUser() user: AuthUser) {
		return this.notifications.list(user.id);
	}

	/** Server-Sent Events: a `notification` event per new notification, `ping` keeps proxies from closing the stream. */
	@Sse("stream")
	stream(@CurrentUser() user: AuthUser): Observable<MessageEvent> {
		return merge(
			this.live.stream$.pipe(
				filter((event) => event.userId === user.id),
				map(
					(event): MessageEvent => ({
						type: "notification",
						data: event.notification,
					}),
				),
			),
			interval(KEEP_ALIVE_MS).pipe(
				map((): MessageEvent => ({ type: "ping", data: "" })),
			),
		);
	}

	@Post("read-all")
	@HttpCode(204)
	markAllRead(@CurrentUser() user: AuthUser): Promise<void> {
		return this.notifications.markAllRead(user.id);
	}

	@Patch(":id/read")
	@HttpCode(204)
	markRead(
		@CurrentUser() user: AuthUser,
		@Param("id", ParseUUIDPipe) id: string,
	): Promise<void> {
		return this.notifications.markRead(user.id, id);
	}
}

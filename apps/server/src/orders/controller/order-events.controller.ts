import {
	Controller,
	type MessageEvent,
	Param,
	ParseUUIDPipe,
	Sse,
	UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import {
	interval,
	last,
	map,
	merge,
	type Observable,
	share,
	takeUntil,
} from "rxjs";
import { CurrentUser } from "../../auth/decorator/current-user.decorator.js";
import { AuthGuard } from "../../auth/guard/auth.guard.js";
import { ACCESS_COOKIE, type AuthUser } from "../../auth/types/auth.types.js";
import { OrdersService } from "../service/orders.service.js";

const KEEP_ALIVE_MS = 25_000;

/**
 * Streaming endpoints, kept apart from the plain REST controller so the
 * response interceptor and future REST-only guards never touch the streams.
 */
@ApiTags("Orders")
@ApiCookieAuth(ACCESS_COOKIE)
@Controller("orders")
export class OrderEventsController {
	constructor(private readonly orders: OrdersService) {}

	/** Server-Sent Events: `order` events carry the full order, `ping` keeps proxies from closing the stream. */
	@Sse(":id/events")
	@UseGuards(AuthGuard)
	async events(
		@CurrentUser() user: AuthUser,
		@Param("id", ParseUUIDPipe) id: string,
	): Promise<Observable<MessageEvent>> {
		await this.orders.getFor(user, id); // 404 for strangers before the stream opens
		const order$ = this.orders.watch(id).pipe(share());
		return merge(
			order$.pipe(map((order): MessageEvent => ({ type: "order", data: order }))),
			interval(KEEP_ALIVE_MS).pipe(
				takeUntil(order$.pipe(last(undefined, null))),
				map((): MessageEvent => ({ type: "ping", data: "" })),
			),
		);
	}
}

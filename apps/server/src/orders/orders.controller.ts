import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	type MessageEvent,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	Query,
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
import { AdminGuard, AuthGuard } from "../auth/auth.guard.js";
import { ACCESS_COOKIE, type AuthUser } from "../auth/auth.types.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import {
	CreateOrderDto,
	ListOrdersQueryDto,
	UpdateOrderStatusDto,
} from "./order.dto.js";
import type { OrderView } from "./order.view.js";
import { OrdersService } from "./orders.service.js";

const KEEP_ALIVE_MS = 25_000;

@ApiTags("Orders")
@ApiCookieAuth(ACCESS_COOKIE)
@Controller("orders")
export class OrdersController {
	constructor(private readonly orders: OrdersService) {}

	@Post()
	@UseGuards(AuthGuard)
	create(
		@CurrentUser() user: AuthUser,
		@Body() dto: CreateOrderDto,
	): Promise<OrderView> {
		return this.orders.create(user.id, dto);
	}

	/** Orders of the signed-in customer. */
	@Get("mine")
	@UseGuards(AuthGuard)
	listMine(
		@CurrentUser() user: AuthUser,
		@Query() query: ListOrdersQueryDto,
	): Promise<OrderView[]> {
		return this.orders.list({ userId: user.id, limit: query.limit });
	}

	/** All orders (admin). */
	@Get()
	@UseGuards(AdminGuard)
	list(@Query() query: ListOrdersQueryDto): Promise<OrderView[]> {
		return this.orders.list(query);
	}

	@Get(":id")
	@UseGuards(AuthGuard)
	get(
		@CurrentUser() user: AuthUser,
		@Param("id", ParseUUIDPipe) id: string,
	): Promise<OrderView> {
		return this.orders.getFor(user, id);
	}

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

	@Patch(":id/status")
	@UseGuards(AdminGuard)
	updateStatus(
		@Param("id", ParseUUIDPipe) id: string,
		@Body() dto: UpdateOrderStatusDto,
	): Promise<OrderView> {
		return this.orders.updateStatus(id, dto.status);
	}

	@Delete(":id")
	@HttpCode(204)
	@UseGuards(AdminGuard)
	remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
		return this.orders.remove(id);
	}
}

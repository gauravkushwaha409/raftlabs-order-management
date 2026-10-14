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
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
import {
	interval,
	last,
	map,
	merge,
	type Observable,
	share,
	takeUntil,
} from "rxjs";
import { AdminGuard } from "../common/admin.guard.js";
import {
	CreateOrderDto,
	ListOrdersQueryDto,
	UpdateOrderStatusDto,
} from "./order.dto.js";
import type { OrderView } from "./order.view.js";
import { OrdersService } from "./orders.service.js";

const KEEP_ALIVE_MS = 25_000;

@ApiTags("Orders")
@Controller("orders")
export class OrdersController {
	constructor(private readonly orders: OrdersService) {}

	@Post()
	create(@Body() dto: CreateOrderDto): Promise<OrderView> {
		return this.orders.create(dto);
	}

	@Get()
	@UseGuards(AdminGuard)
	@ApiSecurity("admin-key")
	list(@Query() query: ListOrdersQueryDto): Promise<OrderView[]> {
		return this.orders.list(query);
	}

	@Get(":id")
	get(@Param("id", ParseUUIDPipe) id: string): Promise<OrderView> {
		return this.orders.get(id);
	}

	/** Server-Sent Events: `order` events carry the full order, `ping` keeps proxies from closing the stream. */
	@Sse(":id/events")
	async events(
		@Param("id", ParseUUIDPipe) id: string,
	): Promise<Observable<MessageEvent>> {
		await this.orders.get(id); // plain 404 before the stream opens
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
	@ApiSecurity("admin-key")
	updateStatus(
		@Param("id", ParseUUIDPipe) id: string,
		@Body() dto: UpdateOrderStatusDto,
	): Promise<OrderView> {
		return this.orders.updateStatus(id, dto.status);
	}

	@Delete(":id")
	@HttpCode(204)
	@UseGuards(AdminGuard)
	@ApiSecurity("admin-key")
	remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
		return this.orders.remove(id);
	}
}

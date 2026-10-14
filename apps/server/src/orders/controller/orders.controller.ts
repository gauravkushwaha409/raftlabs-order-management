import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	Query,
	UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../auth/decorator/current-user.decorator.js";
import { AdminGuard, AuthGuard } from "../../auth/guard/auth.guard.js";
import { ACCESS_COOKIE, type AuthUser } from "../../auth/types/auth.types.js";
import {
	CreateOrderDto,
	ListOrdersQueryDto,
	UpdateOrderStatusDto,
} from "../dto/order.dto.js";
import type { OrderView } from "../dto/order.view.js";
import { OrdersService } from "../service/orders.service.js";

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

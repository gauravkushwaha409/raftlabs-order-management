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
	UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { AdminGuard } from "../auth/auth.guard.js";
import { ACCESS_COOKIE } from "../auth/auth.types.js";
import { CreateMenuItemDto, UpdateMenuItemDto } from "./menu.dto.js";
import {
	type AdminMenuItemView,
	type MenuItemView,
	MenuService,
} from "./menu.service.js";

@ApiTags("Menu")
@Controller("menu")
export class MenuController {
	constructor(private readonly menu: MenuService) {}

	@Get()
	list(): Promise<MenuItemView[]> {
		return this.menu.list();
	}

	/** All items, including unavailable ones (admin). */
	@Get("all")
	@UseGuards(AdminGuard)
	@ApiCookieAuth(ACCESS_COOKIE)
	listAll(): Promise<AdminMenuItemView[]> {
		return this.menu.listAll();
	}

	@Post()
	@UseGuards(AdminGuard)
	@ApiCookieAuth(ACCESS_COOKIE)
	create(@Body() dto: CreateMenuItemDto): Promise<AdminMenuItemView> {
		return this.menu.create(dto);
	}

	@Patch(":id")
	@UseGuards(AdminGuard)
	@ApiCookieAuth(ACCESS_COOKIE)
	update(
		@Param("id", ParseUUIDPipe) id: string,
		@Body() dto: UpdateMenuItemDto,
	): Promise<AdminMenuItemView> {
		return this.menu.update(id, dto);
	}

	@Delete(":id")
	@HttpCode(204)
	@UseGuards(AdminGuard)
	@ApiCookieAuth(ACCESS_COOKIE)
	remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
		return this.menu.remove(id);
	}
}

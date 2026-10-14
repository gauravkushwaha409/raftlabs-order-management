import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { type MenuItemView, MenuService } from "./menu.service.js";

@ApiTags("Menu")
@Controller("menu")
export class MenuController {
	constructor(private readonly menu: MenuService) {}

	@Get()
	list(): Promise<MenuItemView[]> {
		return this.menu.list();
	}
}

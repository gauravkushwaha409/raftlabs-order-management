import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { MenuController } from "./controller/menu.controller.js";
import { MenuService } from "./service/menu.service.js";

@Module({
	imports: [AuthModule],
	controllers: [MenuController],
	providers: [MenuService],
})
export class MenuModule {}

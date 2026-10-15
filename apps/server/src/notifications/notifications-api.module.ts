import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { NotificationsController } from "./notifications.controller.js";
import { NotificationsModule } from "./notifications.module.js";

@Module({
	imports: [AuthModule, NotificationsModule],
	controllers: [NotificationsController],
})
export class NotificationsApiModule {}

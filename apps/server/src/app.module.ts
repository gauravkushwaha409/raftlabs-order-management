import { Module } from "@nestjs/common";
import { APP_PIPE } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";
import { HealthController } from "./health/health.controller.js";
import { MenuModule } from "./menu/menu.module.js";
import { OrdersModule } from "./orders/orders.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { RedisModule } from "./redis/redis.module.js";

@Module({
	imports: [PrismaModule, RedisModule, MenuModule, OrdersModule],
	controllers: [HealthController],
	providers: [{ provide: APP_PIPE, useClass: ZodValidationPipe }],
})
export class AppModule {}

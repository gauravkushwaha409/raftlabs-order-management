import { Module } from "@nestjs/common";
import { APP_GUARD, APP_PIPE } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { ZodValidationPipe } from "nestjs-zod";
import { AuthModule } from "./auth/auth.module.js";
import { HealthController } from "./health/health.controller.js";
import { MenuModule } from "./menu/menu.module.js";
import { OrdersModule } from "./orders/orders.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { RedisModule } from "./redis/redis.module.js";
import { SeedModule } from "./seed/seed.module.js";

@Module({
	imports: [
		// 100 requests/min per client IP overall; credential endpoints are stricter (see AuthController).
		ThrottlerModule.forRoot({
			throttlers: [{ limit: 100, ttl: 60_000 }],
			skipIf: () => process.env.NODE_ENV === "test",
		}),
		PrismaModule,
		RedisModule,
		AuthModule,
		MenuModule,
		OrdersModule,
		SeedModule,
	],
	controllers: [HealthController],
	providers: [
		{ provide: APP_PIPE, useClass: ZodValidationPipe },
		{ provide: APP_GUARD, useClass: ThrottlerGuard },
	],
})
export class AppModule {}

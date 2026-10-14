import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { ZodValidationPipe } from "nestjs-zod";
import { AuthModule } from "./auth/auth.module.js";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter.js";
import { ResponseInterceptor } from "./common/interceptor/response.interceptor.js";
import { HealthController } from "./health/controller/health.controller.js";
import { MenuModule } from "./menu/menu.module.js";
import { OrdersModule } from "./orders/orders.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { RedisModule } from "./redis/redis.module.js";

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
	],
	controllers: [HealthController],
	providers: [
		{ provide: APP_PIPE, useClass: ZodValidationPipe },
		{ provide: APP_GUARD, useClass: ThrottlerGuard },
		// Uniform envelope for every HTTP response; SSE streams, websocket
		// gateways and the Swagger docs are left unwrapped.
		{ provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
		{ provide: APP_FILTER, useClass: HttpExceptionFilter },
	],
})
export class AppModule {}

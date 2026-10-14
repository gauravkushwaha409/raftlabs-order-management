import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./controller/auth.controller.js";
import { AdminGuard, AuthGuard } from "./guard/auth.guard.js";
import { AuthService } from "./service/auth.service.js";
import { JwtStrategy } from "./strategy/jwt.strategy.js";
import { jwtSecret } from "./util/jwt-secret.js";

@Module({
	imports: [
		PassportModule,
		JwtModule.registerAsync({
			useFactory: () => ({
				secret: jwtSecret(),
				signOptions: { expiresIn: "7d" },
			}),
		}),
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy, AuthGuard, AdminGuard],
	exports: [AuthService, AuthGuard, AdminGuard],
})
export class AuthModule {}

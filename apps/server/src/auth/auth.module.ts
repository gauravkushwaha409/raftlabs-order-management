import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./controller/auth.controller.js";
import { AdminGuard, AuthGuard } from "./guard/auth.guard.js";
import { AuthService } from "./service/auth.service.js";

function jwtSecret() {
	const secret = process.env.JWT_SECRET;
	if (!secret || secret.length < 32)
		throw new Error("JWT_SECRET must be set to at least 32 characters");
	return secret;
}

@Module({
	imports: [
		JwtModule.registerAsync({
			useFactory: () => ({
				secret: jwtSecret(),
				signOptions: { expiresIn: "7d" },
			}),
		}),
	],
	controllers: [AuthController],
	providers: [AuthService, AuthGuard, AdminGuard],
	exports: [AuthService, AuthGuard, AdminGuard],
})
export class AuthModule {}

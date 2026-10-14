import {
	Body,
	Controller,
	Get,
	HttpCode,
	Post,
	Res,
	UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { LoginDto, RegisterDto } from "./auth.dto.js";
import { AuthGuard } from "./auth.guard.js";
import { AuthService } from "./auth.service.js";
import { ACCESS_COOKIE, type AuthUser } from "./auth.types.js";
import { sessionCookieOptions } from "./cookies.js";
import { CurrentUser } from "./current-user.decorator.js";

// Credential endpoints are brute-force targets: much stricter than the global limit.
const CREDENTIAL_LIMIT = { default: { limit: 10, ttl: 60_000 } };

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
	constructor(private readonly auth: AuthService) {}

	@Post("register")
	@Throttle(CREDENTIAL_LIMIT)
	async register(
		@Body() dto: RegisterDto,
		@Res({ passthrough: true }) response: Response,
	): Promise<AuthUser> {
		const { user, token } = await this.auth.register(dto);
		response.cookie(ACCESS_COOKIE, token, sessionCookieOptions());
		return user;
	}

	@Post("login")
	@HttpCode(200)
	@Throttle(CREDENTIAL_LIMIT)
	async login(
		@Body() dto: LoginDto,
		@Res({ passthrough: true }) response: Response,
	): Promise<AuthUser> {
		const { user, token } = await this.auth.login(dto);
		response.cookie(ACCESS_COOKIE, token, sessionCookieOptions());
		return user;
	}

	@Post("logout")
	@HttpCode(204)
	logout(@Res({ passthrough: true }) response: Response): void {
		const { maxAge: _maxAge, ...options } = sessionCookieOptions();
		response.clearCookie(ACCESS_COOKIE, options);
	}

	@Get("me")
	@UseGuards(AuthGuard)
	@ApiCookieAuth(ACCESS_COOKIE)
	me(@CurrentUser() user: AuthUser): AuthUser {
		return user;
	}
}

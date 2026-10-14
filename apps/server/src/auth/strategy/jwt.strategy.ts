import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "../service/auth.service.js";
import { ACCESS_COOKIE, type AuthUser } from "../types/auth.types.js";
import { readCookie } from "../util/cookies.js";
import { jwtSecret } from "../util/jwt-secret.js";

export interface JwtPayload {
	sub: string;
}

/**
 * Cookie-based JWT strategy ("jwt"). Passport verifies the signature and
 * expiry; `validate` then resolves the live user so deleted accounts lose
 * access at once. Scaling to new methods (OAuth, API keys, …) means adding
 * another strategy here — guards stay untouched.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
	constructor(private readonly auth: AuthService) {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				(request) => readCookie(request?.headers?.cookie, ACCESS_COOKIE) ?? null,
			]),
			secretOrKey: jwtSecret(),
		});
	}

	async validate(payload: JwtPayload): Promise<AuthUser> {
		const user = await this.auth.resolveUser(payload.sub);
		if (!user) throw new UnauthorizedException("Sign in to continue");
		return user;
	}
}

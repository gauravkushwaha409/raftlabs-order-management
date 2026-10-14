import {
	type CanActivate,
	type ExecutionContext,
	ForbiddenException,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "../service/auth.service.js";
import {
	ACCESS_COOKIE,
	type AuthenticatedRequest,
} from "../types/auth.types.js";
import { readCookie } from "../util/cookies.js";

/** Requires a valid session cookie and attaches the user as `request.user`. */
@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private readonly auth: AuthService) {}

	async canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
		const user = await this.auth.authenticate(
			readCookie(request.headers.cookie, ACCESS_COOKIE),
		);
		if (!user) throw new UnauthorizedException("Sign in to continue");
		request.user = user;
		return true;
	}
}

/** Like AuthGuard, and additionally requires the ADMIN role. */
@Injectable()
export class AdminGuard extends AuthGuard {
	override async canActivate(context: ExecutionContext) {
		await super.canActivate(context);
		if (
			context.switchToHttp().getRequest<AuthenticatedRequest>().user.role !==
			"ADMIN"
		) {
			throw new ForbiddenException("Admin access required");
		}
		return true;
	}
}

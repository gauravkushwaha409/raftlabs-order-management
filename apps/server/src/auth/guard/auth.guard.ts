import {
	type ExecutionContext,
	ForbiddenException,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard as PassportAuthGuard } from "@nestjs/passport";
import type { AuthenticatedRequest } from "../types/auth.types.js";

/** Requires a valid session cookie and attaches the user as `request.user`. */
@Injectable()
export class AuthGuard extends PassportAuthGuard("jwt") {
	override handleRequest<TUser>(err: unknown, user: TUser): TUser {
		if (err) throw err;
		if (!user) throw new UnauthorizedException("Sign in to continue");
		return user;
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

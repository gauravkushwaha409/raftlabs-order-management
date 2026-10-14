import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { isValidAdminKey } from "./admin-key.js";

@Injectable()
export class AdminGuard implements CanActivate {
	canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest<Request>();
		if (!isValidAdminKey(request.headers["x-admin-key"])) {
			throw new UnauthorizedException("Invalid or missing admin key");
		}
		return true;
	}
}

import {
	type CallHandler,
	type ExecutionContext,
	Injectable,
	type NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request, Response } from "express";
import type { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ApiResponse } from "../dto/api-response.dto.js";

/**
 * Metadata key set by Nest's `@Sse()` decorator (SSE_METADATA in
 * `@nestjs/common/constants`). Kept as a literal to avoid a deep import.
 */
const SSE_METADATA = "__sse__";

@Injectable()
export class ResponseInterceptor<T>
	implements NestInterceptor<T, ApiResponse<T>>
{
	constructor(private readonly reflector: Reflector) {}

	intercept(
		context: ExecutionContext,
		next: CallHandler,
	): Observable<ApiResponse<T>> {
		// HTTP-only: websocket gateways follow their own ack contract and must
		// not be wrapped.
		if (context.getType() !== "http") return next.handle();

		// SSE endpoints stream MessageEvents; wrapping each emission would
		// break every live client.
		const handler = context.getHandler();
		if (this.reflector.getAllAndOverride<boolean>(SSE_METADATA, [handler])) {
			return next.handle();
		}

		const http = context.switchToHttp();
		const response = http.getResponse<Response>();
		const request = http.getRequest<Request>();

		// Swagger UI and its JSON document are not API responses.
		if (request?.url?.startsWith("/api/v1/docs")) return next.handle();

		return next.handle().pipe(
			map((data) => {
				// Allow a controller to override the message via data.message.
				const message = data?.message ?? this.resolveMessage(request.method);
				const payload = data?.message ? (data.data ?? data) : data;
				return ApiResponse.success(payload, message, response.statusCode);
			}),
		);
	}

	private resolveMessage(method: string): string {
		const messages: Record<string, string> = {
			GET: "Data fetched successfully",
			POST: "Created successfully",
			PUT: "Updated successfully",
			PATCH: "Updated successfully",
			DELETE: "Deleted successfully",
		};
		return messages[method] ?? "Success";
	}
}

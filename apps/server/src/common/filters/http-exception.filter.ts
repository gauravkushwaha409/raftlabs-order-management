import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";
import { ApiResponse } from "../dto/api-response.dto.js";

/**
 * Formats every error into the same envelope successful responses use:
 * `{ success: false, statusCode, message, error }`. Thrown 4xx messages are
 * safe to surface; unexpected 5xx failures collapse to a generic message so
 * internals never leak.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		const statusCode =
			exception instanceof HttpException
				? exception.getStatus()
				: HttpStatus.INTERNAL_SERVER_ERROR;

		const { message, error } = this.describe(exception);
		response
			.status(statusCode)
			.json(ApiResponse.error(message, statusCode, error));
	}

	private describe(exception: unknown): { message: string; error: string } {
		if (exception instanceof HttpException) {
			const body = exception.getResponse();
			if (typeof body === "string") {
				return { message: body, error: exception.name };
			}
			if (typeof body === "object" && body !== null) {
				const raw = body as Record<string, unknown>;
				let message = "Request failed";
				if (Array.isArray(raw.message)) {
					message = raw.message.map(String).join(", ");
				} else if (typeof raw.message === "string") {
					message = raw.message;
				} else if (typeof raw.error === "string") {
					message = raw.error;
				}
				const error = typeof raw.error === "string" ? raw.error : exception.name;
				return { message, error };
			}
			return { message: exception.message, error: exception.name };
		}
		if (exception instanceof Error) {
			return { message: "Internal server error", error: exception.name };
		}
		return { message: "Internal server error", error: "InternalServerError" };
	}
}

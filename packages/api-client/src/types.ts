import type { AxiosResponse } from "axios";

/**
 * Uniform envelope every API response uses:
 * `{ success, statusCode, message, data }` on success and
 * `{ success: false, statusCode, message, error }` on failure.
 */
export interface ServerResponse<T> {
	success: boolean;
	statusCode: number;
	message: string;
	data: T;
}

export interface ServerErrorBody {
	success: boolean;
	statusCode: number;
	message: string;
	error: string;
}

export type ApiResponse<T> = AxiosResponse<ServerResponse<T>>;

/**
 * Normalized request failure. Carries the HTTP `status` (0 when the request
 * never reached the server) and the envelope's human-readable message, so UI
 * code can keep branching on `error instanceof ApiError`.
 */
export class ApiError extends Error {
	readonly status: number;
	readonly code: string;

	constructor(message: string, status: number, code = "RequestFailed") {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.code = code;
	}
}

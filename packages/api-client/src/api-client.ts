import axios, { type AxiosError, type AxiosInstance } from "axios";
import { ApiError, type ServerErrorBody } from "./types.js";

export const createApiClient = (baseURL: string) =>
	axios.create({
		baseURL,
		timeout: 10_000,
		headers: { "Content-Type": "application/json" },
		withCredentials: true,
	});

/** Flattens any axios failure into an `ApiError` the UI can branch on. */
export function toApiError(error: unknown): ApiError {
	if (error instanceof ApiError) return error;
	if (axios.isAxiosError(error)) {
		const response = (error as AxiosError<ServerErrorBody>).response;
		if (response) {
			const body = response.data;
			const message =
				typeof body?.message === "string"
					? body.message
					: `Request failed (${response.status})`;
			const code = typeof body?.error === "string" ? body.error : "RequestFailed";
			return new ApiError(message, response.status, code);
		}
		return new ApiError(error.message || "Network error", 0, "NetworkError");
	}
	return new ApiError(
		error instanceof Error ? error.message : "Request failed",
		0,
		"UnknownError",
	);
}

export type { AxiosInstance };

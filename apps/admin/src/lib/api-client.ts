import { createApiClient, toApiError } from "@package/api-client";

// Dev/docker: same-origin via the Vite proxy. Hosted: absolute URL baked in at build time.
export const SERVER_ORIGIN = __PROXY_ENABLED__
	? window.location.origin
	: __SERVER_URL__;
const API_BASE_URL = `${SERVER_ORIGIN}/api/v1`;

export const apiClient = createApiClient(API_BASE_URL);

// Every rejection surfaces as an ApiError (status + envelope message), so UI
// code can keep branching on `error instanceof ApiError`.
apiClient.interceptors.response.use(
	(response) => response,
	(error) => Promise.reject(toApiError(error)),
);

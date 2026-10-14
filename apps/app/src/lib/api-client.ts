import { createApiClient, toApiError } from "@package/api-client";
import { ENDPOINTS } from "@/config/endpoints";

// Dev/docker: same-origin via the Vite proxy. Hosted: absolute URL baked in at build time.
export const SERVER_ORIGIN = __PROXY_ENABLED__
	? window.location.origin
	: __SERVER_URL__;
const API_BASE_URL = __PROXY_ENABLED__ ? "/api/v1" : `${__SERVER_URL__}/api/v1`;

export const apiClient = createApiClient(API_BASE_URL);

// Every rejection surfaces as an ApiError (status + envelope message), so UI
// code can keep branching on `error instanceof ApiError`.
apiClient.interceptors.response.use(
	(response) => response,
	(error) => Promise.reject(toApiError(error)),
);

/** Absolute URL of an order's Server-Sent Events stream. */
export const orderEventsUrl = (orderId: string) =>
	`${SERVER_ORIGIN}/api/v1${ENDPOINTS.ORDERS.EVENTS(orderId)}`;

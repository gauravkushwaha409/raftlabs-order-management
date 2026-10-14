import type { ApiResponse } from "@package/api-client";
import type { Order, OrderStatus } from "@/types/api";

export namespace OrderTypes {
	export interface UpdateStatusPayload {
		order: Order;
		status: OrderStatus;
	}

	/** Wire shape of GET /orders. Unwrap with `response.data.data`. */
	export type ListResponse = ApiResponse<Order[]>;

	/** Wire shape of PATCH /orders/:id/status. Unwrap with `response.data.data`. */
	export type UpdateStatusResponse = ApiResponse<Order>;
}

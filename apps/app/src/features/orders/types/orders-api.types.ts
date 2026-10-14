import type { ApiResponse } from "@package/api-client";
import type { CreateOrderInput, Order } from "@/types/api";

export namespace OrderTypes {
	export type CreatePayload = CreateOrderInput;

	/** Wire shape of POST /orders. Unwrap with `response.data.data`. */
	export type CreateResponse = ApiResponse<Order>;

	/** Wire shape of GET /orders/mine. Unwrap with `response.data.data`. */
	export type ListResponse = ApiResponse<Order[]>;

	/** Wire shape of GET /orders/:id. Unwrap with `response.data.data`. */
	export type DetailResponse = ApiResponse<Order>;
}

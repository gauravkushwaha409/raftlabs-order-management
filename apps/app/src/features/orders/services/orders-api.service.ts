import { BaseApiService } from "@package/api-client";
import { ENDPOINTS } from "@/config/endpoints";
import { apiClient } from "@/lib/api-client";
import type { Order } from "@/types/api";
import type { OrderTypes } from "../types/orders-api.types";

class OrdersApiService extends BaseApiService {
	async createOrder(
		payload: OrderTypes.CreatePayload,
	): Promise<OrderTypes.CreateResponse> {
		return super.post<Order>(ENDPOINTS.ORDERS.CREATE, payload);
	}

	async listMyOrders(): Promise<OrderTypes.ListResponse> {
		return super.get<Order[]>(ENDPOINTS.ORDERS.MINE);
	}

	async getOrder(orderId: string): Promise<OrderTypes.DetailResponse> {
		return super.get<Order>(ENDPOINTS.ORDERS.DETAIL(orderId));
	}
}

export const ordersApiService = new OrdersApiService(apiClient);

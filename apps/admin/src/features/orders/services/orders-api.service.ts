import { BaseApiService } from "@package/api-client";
import { ENDPOINTS } from "@/config/endpoints";
import { apiClient } from "@/lib/api-client";
import type { Order, OrderStatus } from "@/types/api";
import type { OrderTypes } from "../types/orders-api.types";

class OrdersApiService extends BaseApiService {
	async listOrders(): Promise<OrderTypes.ListResponse> {
		return super.get<Order[]>(ENDPOINTS.ORDERS.LIST);
	}

	async updateOrderStatus(
		orderId: string,
		status: OrderStatus,
	): Promise<OrderTypes.UpdateStatusResponse> {
		return super.patch<Order>(ENDPOINTS.ORDERS.STATUS(orderId), { status });
	}

	async deleteOrder(orderId: string): Promise<void> {
		await super.delete(ENDPOINTS.ORDERS.DETAIL(orderId));
	}
}

export const ordersApiService = new OrdersApiService(apiClient);

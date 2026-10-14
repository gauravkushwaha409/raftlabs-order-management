import { ApiError } from "@package/api-client";
import { useQuery } from "@package/query";
import { QUERY_KEYS } from "@/config/query-keys";
import type { Order } from "@/types/api";
import { ordersApiService } from "../../services/orders-api.service";

export const useMyOrdersQuery = () =>
	useQuery<Order[], ApiError, Order[]>(
		[...QUERY_KEYS.ORDERS.MINE],
		() => ordersApiService.listMyOrders().then((response) => response.data.data),
		undefined,
		{ refetchOnMount: "always", staleTime: 0 },
	);

export const useOrderQuery = (orderId: string) =>
	useQuery<Order, ApiError, Order>(
		[...QUERY_KEYS.ORDERS.DETAIL(orderId)],
		() =>
			ordersApiService.getOrder(orderId).then((response) => response.data.data),
		undefined,
		{ staleTime: 0, refetchOnMount: "always" },
	);

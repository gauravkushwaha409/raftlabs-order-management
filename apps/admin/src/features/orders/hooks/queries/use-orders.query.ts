import { ApiError } from "@package/api-client";
import { useQuery } from "@package/query";
import { QUERY_KEYS } from "@/config/query-keys";
import type { Order } from "@/types/api";
import { ordersApiService } from "../../services/orders-api.service";

export const useOrdersQuery = () =>
	useQuery<Order[], ApiError, Order[]>(
		[...QUERY_KEYS.ORDERS.ALL],
		() => ordersApiService.listOrders().then((response) => response.data.data),
		undefined,
		{ refetchOnMount: "always" },
	);

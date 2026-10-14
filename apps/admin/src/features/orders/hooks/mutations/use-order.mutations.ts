import { ApiError } from "@package/api-client";
import { useMutation } from "@package/query";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/config/query-keys";
import { applyOrderEvent } from "@/lib/order-cache";
import type { Order, OrderEvent } from "@/types/api";
import { ordersApiService } from "../../services/orders-api.service";
import type { OrderTypes } from "../../types/orders-api.types";

const applyToCache = (queryClient: QueryClient, event: OrderEvent) =>
	queryClient.setQueryData<Order[]>([...QUERY_KEYS.ORDERS.ALL], (orders) =>
		orders ? applyOrderEvent(orders, event) : orders,
	);

export const signOutIfUnauthorized =
	(signOut: () => void) => (error: Error | null) => {
		if (
			error instanceof ApiError &&
			(error.status === 401 || error.status === 403)
		)
			signOut();
	};

export function useUpdateOrderStatusMutation(signOut: () => void) {
	const queryClient = useQueryClient();
	return useMutation<
		OrderTypes.UpdateStatusResponse,
		ApiError,
		OrderTypes.UpdateStatusPayload
	>(
		({ order, status }) => ordersApiService.updateOrderStatus(order.id, status),
		{
			onSuccess: (response) => {
				const order = response.data?.data;
				if (!order) return;
				applyToCache(queryClient, { type: "updated", order });
			},
			onError: signOutIfUnauthorized(signOut),
		},
	);
}
export function useDeleteOrderMutation(signOut: () => void) {
	const queryClient = useQueryClient();
	return useMutation<void, ApiError, Order>(
		(order: Order) => ordersApiService.deleteOrder(order.id),
		{
			onSuccess: (_data, order) =>
				applyToCache(queryClient, { type: "deleted", order }),
			onError: signOutIfUnauthorized(signOut),
		},
	);
}

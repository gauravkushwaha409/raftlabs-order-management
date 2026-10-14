import { ApiError } from "@package/api-client";
import { useMutation } from "@package/query";
import type { Order } from "@/types/api";
import { ordersApiService } from "../../services/orders-api.service";
import type { OrderTypes } from "../../types/orders-api.types";

export function useCreateOrderMutation(onSuccess: (order: Order) => void) {
	return useMutation<
		OrderTypes.CreateResponse,
		ApiError,
		OrderTypes.CreatePayload
	>((payload) => ordersApiService.createOrder(payload), {
		onSuccess: (response) => {
			const order = response.data?.data;
			if (!order) return;
			onSuccess(order);
		},
	});
}

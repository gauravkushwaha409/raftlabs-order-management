import { toast } from "@package/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { QUERY_KEYS } from "@/config/query-keys";
import { orderEventsUrl } from "@/lib/api-client";
/**
 * Order state kept live over Server-Sent Events. The REST read provides the first paint and the
 * error state (404); the stream then patches the same cache entry and closes itself on a final status.
 */
import type { Order, OrderStatus } from "@/types/api";
import { useOrderQuery } from "./hooks/queries/use-order.queries";
import { isFinalStatus, PROGRESS_STEPS } from "./order-status";

export function useOrderStatus(orderId: string) {
	const queryClient = useQueryClient();
	const queryKey = useMemo(
		() => [...QUERY_KEYS.ORDERS.DETAIL(orderId)],
		[orderId],
	);
	const order = useOrderQuery(orderId);
	const [live, setLive] = useState(false);

	useEffect(() => {
		const source = new EventSource(orderEventsUrl(orderId), {
			withCredentials: true,
		});
		source.onopen = () => setLive(true);
		source.onerror = () => setLive(false); // EventSource reconnects on its own
		source.addEventListener("order", (event) => {
			const next = JSON.parse((event as MessageEvent<string>).data) as Order;
			const previous = queryClient.getQueryData<Order>(queryKey);
			queryClient.setQueryData<Order>(queryKey, next);
			// The first emission mirrors what the REST read already painted;
			// only toast when the status actually moved.
			if (previous && previous.status !== next.status) {
				notifyStatusChange(next.status);
			}
			if (isFinalStatus(next.status)) {
				source.close();
				setLive(false);
			}
		});
		return () => source.close();
	}, [orderId, queryClient, queryKey]);

	return {
		order: order.data,
		error: order.error,
		isPending: order.isPending,
		live,
	};
}

function notifyStatusChange(status: OrderStatus) {
	if (status === "CANCELLED") {
		toast.error("Order cancelled", {
			description: "The restaurant had to cancel your order.",
		});
		return;
	}
	const step = PROGRESS_STEPS.find((entry) => entry.status === status);
	if (status === "DELIVERED" || !step) {
		toast.success(step?.label ?? "Delivered", {
			description: step?.hint ?? "Enjoy your meal.",
		});
		return;
	}
	toast.info(step.label, { description: step.hint });
}

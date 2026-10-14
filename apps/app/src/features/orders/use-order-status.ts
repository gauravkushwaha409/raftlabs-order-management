import { useQuery } from "@package/query";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getOrder, orderEventsUrl } from "@/lib/api";
import type { Order } from "@/types/api";
import { isFinalStatus } from "./order-status";

/**
 * Order state kept live over Server-Sent Events. The REST read provides the first paint and the
 * error state (404); the stream then patches the same cache entry and closes itself on a final status.
 */
export function useOrderStatus(orderId: string) {
	const queryClient = useQueryClient();
	const queryKey = ["order", orderId];
	const order = useQuery(queryKey, () => getOrder(orderId), undefined, {
		staleTime: 0,
		refetchOnMount: "always",
	});
	const [live, setLive] = useState(false);

	useEffect(() => {
		const source = new EventSource(orderEventsUrl(orderId));
		source.onopen = () => setLive(true);
		source.onerror = () => setLive(false); // EventSource reconnects on its own
		source.addEventListener("order", (event) => {
			const next = JSON.parse((event as MessageEvent<string>).data) as Order;
			queryClient.setQueryData(["order", orderId], next);
			if (isFinalStatus(next.status)) {
				source.close();
				setLive(false);
			}
		});
		return () => source.close();
	}, [orderId, queryClient]);

	return {
		order: order.data,
		error: order.error,
		isPending: order.isPending,
		live,
	};
}

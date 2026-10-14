import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { QUERY_KEYS } from "@/config/query-keys";
import { SERVER_ORIGIN } from "@/lib/api-client";
import { applyOrderEvent } from "@/lib/order-cache";
import type { Order, OrderEvent } from "@/types/api";

export const ORDERS_QUERY_KEY = [...QUERY_KEYS.ORDERS.ALL];

/** Keeps the cached order list in sync with the API's admin websocket (namespace /admin, session cookie). */
export function useLiveOrders(onUnauthorized: () => void) {
	const queryClient = useQueryClient();
	const [connected, setConnected] = useState(false);

	useEffect(() => {
		const socket = io(`${SERVER_ORIGIN}/admin`, { withCredentials: true });
		socket.on("connect", () => setConnected(true));
		socket.on("disconnect", () => setConnected(false));
		socket.on("unauthorized", onUnauthorized);
		socket.on("order", (event: OrderEvent) =>
			queryClient.setQueryData<Order[]>(ORDERS_QUERY_KEY, (orders) =>
				orders ? applyOrderEvent(orders, event) : orders,
			),
		);
		return () => {
			socket.disconnect();
		};
	}, [onUnauthorized, queryClient]);

	return { connected };
}

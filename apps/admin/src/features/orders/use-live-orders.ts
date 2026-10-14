import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { SERVER_ORIGIN } from "@/lib/api";
import { applyOrderEvent } from "@/lib/order-cache";
import type { Order, OrderEvent } from "@/types/api";

export const ORDERS_QUERY_KEY = ["orders"];

/** Keeps the cached order list in sync with the API's admin websocket (namespace /admin). */
export function useLiveOrders(adminKey: string, onUnauthorized: () => void) {
	const queryClient = useQueryClient();
	const [connected, setConnected] = useState(false);

	useEffect(() => {
		const socket = io(`${SERVER_ORIGIN}/admin`, { auth: { key: adminKey } });
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
	}, [adminKey, onUnauthorized, queryClient]);

	return { connected };
}

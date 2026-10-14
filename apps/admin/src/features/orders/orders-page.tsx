import { useMutation, useQuery } from "@package/query";
import { Button } from "@package/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAdminKey } from "@/features/auth/admin-key";
import {
	ApiError,
	deleteOrder,
	listOrders,
	updateOrderStatus,
} from "@/lib/api";
import { applyOrderEvent } from "@/lib/order-cache";
import {
	ORDER_STATUSES,
	type Order,
	type OrderEvent,
	type OrderStatus,
} from "@/types/api";
import { STATUS_LABEL } from "./order-status";
import { OrdersTable } from "./orders-table";
import { ORDERS_QUERY_KEY, useLiveOrders } from "./use-live-orders";

export function OrdersPage({ adminKey }: { adminKey: string }) {
	const { signOut } = useAdminKey();
	const queryClient = useQueryClient();
	const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
	const { connected } = useLiveOrders(adminKey, signOut);

	const signOutIfUnauthorized = (error: Error | null) => {
		if (error instanceof ApiError && error.status === 401) signOut();
	};
	const applyToCache = (event: OrderEvent) =>
		queryClient.setQueryData<Order[]>(ORDERS_QUERY_KEY, (orders) =>
			orders ? applyOrderEvent(orders, event) : orders,
		);

	const orders = useQuery(
		ORDERS_QUERY_KEY,
		() => listOrders(adminKey),
		undefined,
		{ refetchOnMount: "always" },
	);
	useEffect(() => signOutIfUnauthorized(orders.error));

	const change = useMutation(
		({ order, status }: { order: Order; status: OrderStatus }) =>
			updateOrderStatus(adminKey, order.id, status),
		{
			onSuccess: (order) => applyToCache({ type: "updated", order }),
			onError: signOutIfUnauthorized,
		},
	);
	const remove = useMutation((order: Order) => deleteOrder(adminKey, order.id), {
		onSuccess: (_, order) => applyToCache({ type: "deleted", order }),
		onError: signOutIfUnauthorized,
	});

	const mutationError = change.error ?? remove.error;
	const visible = (orders.data ?? []).filter(
		(order) => filter === "ALL" || order.status === filter,
	);
	const busyOrderId = change.isPending
		? change.variables?.order.id
		: remove.isPending
			? remove.variables?.id
			: null;

	return (
		<div className="flex flex-col gap-4">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<h2 className="typo-h4 text-gray-800">Orders</h2>
					<span
						className={`typo-t5 rounded-full px-2.5 py-1 font-medium ${connected ? "bg-success-25 text-success-600" : "bg-gray-100 text-gray-500"}`}
					>
						{connected ? "Live" : "Offline"}
					</span>
				</div>
				<label className="typo-t4 flex items-center gap-2 text-gray-600">
					Status
					<select
						className="typo-t4 h-9 rounded-md border border-gray-border-200 bg-white-base px-2"
						value={filter}
						onChange={(event) => setFilter(event.target.value as OrderStatus | "ALL")}
					>
						<option value="ALL">All</option>
						{ORDER_STATUSES.map((status) => (
							<option key={status} value={status}>
								{STATUS_LABEL[status]}
							</option>
						))}
					</select>
				</label>
			</header>

			{mutationError && (
				<p
					role="alert"
					className="typo-t3 rounded-lg bg-alert-25 p-3 text-alert-600"
				>
					{mutationError.message}
				</p>
			)}

			{orders.isPending ? (
				<div
					role="status"
					aria-label="Loading orders"
					className="h-48 animate-pulse rounded-xl bg-gray-100"
				/>
			) : orders.isError ? (
				<div
					role="alert"
					className="flex flex-col items-center gap-3 py-12 text-center"
				>
					<p className="typo-t2 text-gray-800">
						Couldn't load orders: {orders.error.message}
					</p>
					<Button
						className="w-auto"
						variant="secondary"
						onClick={() => orders.refetch()}
					>
						Try again
					</Button>
				</div>
			) : (
				<OrdersTable
					orders={visible}
					busyOrderId={busyOrderId}
					onStatusChange={(order, status) => change.mutate({ order, status })}
					onDelete={(order) => {
						if (
							window.confirm(
								`Delete order ${order.id.slice(0, 8).toUpperCase()}? This cannot be undone.`,
							)
						)
							remove.mutate(order);
					}}
				/>
			)}
		</div>
	);
}

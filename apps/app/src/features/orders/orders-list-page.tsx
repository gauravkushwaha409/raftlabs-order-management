import { useQuery } from "@package/query";
import { Badge, Button, buttonVariants, cn } from "@package/ui";
import { Link } from "@tanstack/react-router";
import { getMyOrders } from "@/lib/api";
import { formatPrice } from "@/lib/money";
import type { OrderStatus } from "@/types/api";
import { PROGRESS_STEPS } from "./order-status";

const BADGE = {
	RECEIVED: "info",
	PREPARING: "warning",
	OUT_FOR_DELIVERY: "magenta",
	DELIVERED: "success",
	CANCELLED: "alert",
} as const satisfies Record<OrderStatus, string>;

const labelFor = (status: OrderStatus) =>
	status === "CANCELLED"
		? "Cancelled"
		: (PROGRESS_STEPS.find((step) => step.status === status)?.label ?? status);

export function OrdersListPage() {
	const orders = useQuery(["orders", "mine"], getMyOrders, undefined, {
		refetchOnMount: "always",
		staleTime: 0,
	});

	if (orders.isPending)
		return (
			<div
				role="status"
				aria-label="Loading orders"
				className="h-48 animate-pulse rounded-xl bg-gray-100"
			/>
		);
	if (orders.isError) {
		return (
			<div
				role="alert"
				className="flex flex-col items-center gap-3 py-12 text-center"
			>
				<p className="typo-t1 text-gray-800">We couldn't load your orders.</p>
				<Button
					className="w-auto"
					variant="secondary"
					onClick={() => orders.refetch()}
				>
					Try again
				</Button>
			</div>
		);
	}

	return (
		<div className="mx-auto flex max-w-2xl flex-col gap-4">
			<h2 className="typo-h4 text-gray-800">My orders</h2>
			{orders.data.length === 0 ? (
				<div className="flex flex-col items-center gap-3 py-12 text-center">
					<p className="typo-t2 text-gray-600">You haven't ordered anything yet.</p>
					<Link
						to="/"
						className={cn(
							buttonVariants({ variant: "default", size: "default" }),
							"w-auto",
						)}
					>
						Browse the menu
					</Link>
				</div>
			) : (
				<ul className="flex flex-col gap-3">
					{orders.data.map((order) => (
						<li key={order.id}>
							<Link
								to="/orders/$orderId"
								params={{ orderId: order.id }}
								className="flex items-center justify-between gap-4 rounded-xl border border-gray-border-200 p-4 hover:border-primary-200"
							>
								<div>
									<p className="typo-t2 font-medium text-gray-800">
										Order #{order.id.slice(0, 8).toUpperCase()}
									</p>
									<p className="typo-t4 text-gray-500">
										{new Date(order.createdAt).toLocaleString()} ·{" "}
										{order.items.reduce((sum, item) => sum + item.quantity, 0)} items ·{" "}
										{formatPrice(order.totalCents)}
									</p>
								</div>
								<Badge variant={BADGE[order.status]}>{labelFor(order.status)}</Badge>
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

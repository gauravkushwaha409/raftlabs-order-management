import { buttonVariants, cn } from "@package/ui";
import { Link } from "@tanstack/react-router";
import { ApiError } from "@/lib/api";
import { OrderTracker } from "./order-tracker";
import { useOrderStatus } from "./use-order-status";

export function OrderPage({ orderId }: { orderId: string }) {
	const { order, error, isPending, live } = useOrderStatus(orderId);

	if (isPending) {
		return (
			<div
				role="status"
				aria-label="Loading order"
				className="h-64 animate-pulse rounded-xl bg-gray-100"
			/>
		);
	}

	if (error instanceof ApiError && error.status === 401) {
		return (
			<div
				role="alert"
				className="flex flex-col items-center gap-3 py-16 text-center"
			>
				<p className="typo-t1 text-gray-800">Your session has expired.</p>
				<Link
					to="/login"
					search={{ redirect: `/orders/${orderId}` }}
					className={cn(
						buttonVariants({ variant: "default", size: "default" }),
						"w-auto",
					)}
				>
					Sign in
				</Link>
			</div>
		);
	}

	if (error || !order) {
		const notFound = error instanceof ApiError && error.status === 404;
		return (
			<div
				role="alert"
				className="flex flex-col items-center gap-3 py-16 text-center"
			>
				<p className="typo-t1 text-gray-800">
					{notFound
						? "We couldn't find that order."
						: "We couldn't load your order."}
				</p>
				<Link
					to="/"
					className={cn(
						buttonVariants({ variant: "secondary", size: "default" }),
						"w-auto",
					)}
				>
					Back to the menu
				</Link>
			</div>
		);
	}

	return (
		<div className="mx-auto flex max-w-2xl flex-col gap-6">
			<header className="flex items-start justify-between gap-4">
				<div>
					<h2 className="typo-h4 text-gray-800">Track your order</h2>
					<p className="typo-t4 text-gray-500">
						Order #{order.id.slice(0, 8).toUpperCase()}
					</p>
				</div>
				{live && (
					<span className="typo-t5 flex items-center gap-1.5 rounded-full bg-success-25 px-2.5 py-1 font-medium text-success-600">
						<span className="size-1.5 animate-pulse rounded-full bg-success-600" />
						Live
					</span>
				)}
			</header>
			<OrderTracker order={order} />
			<Link
				to="/"
				className={cn(
					buttonVariants({ variant: "secondary", size: "default" }),
					"w-auto self-start",
				)}
			>
				Order something else
			</Link>
		</div>
	);
}

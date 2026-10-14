import { cn } from "@package/ui";
import { CheckIcon } from "lucide-react";
import { formatPrice } from "@/lib/money";
import type { Order } from "@/types/api";
import { PROGRESS_STEPS } from "./order-status";

export function OrderTracker({ order }: { order: Order }) {
	const cancelled = order.status === "CANCELLED";
	const currentIndex = PROGRESS_STEPS.findIndex(
		(step) => step.status === order.status,
	);

	return (
		<div className="flex flex-col gap-8">
			{cancelled ? (
				<p
					role="status"
					className="typo-t2 rounded-xl bg-alert-25 p-4 font-medium text-alert-600"
				>
					This order was cancelled.
				</p>
			) : (
				<ol aria-label="Order progress" className="flex flex-col gap-0">
					{PROGRESS_STEPS.map((step, index) => {
						const done = index < currentIndex || order.status === "DELIVERED";
						const current = index === currentIndex && order.status !== "DELIVERED";
						return (
							<li
								key={step.status}
								aria-current={current ? "step" : undefined}
								className="flex gap-4"
							>
								<div className="flex flex-col items-center">
									<span
										className={cn(
											"flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold",
											done && "border-success-600 bg-success-600 text-white-base",
											current && "border-primary-500 bg-primary-50 text-primary-500",
											!done && !current && "border-gray-border-200 text-gray-400",
										)}
									>
										{done ? <CheckIcon size={16} /> : index + 1}
									</span>
									{index < PROGRESS_STEPS.length - 1 && (
										<span
											className={cn(
												"my-1 h-8 w-0.5",
												done ? "bg-success-600" : "bg-gray-border-200",
											)}
										/>
									)}
								</div>
								<div className="pb-6">
									<p
										className={cn(
											"typo-t1 font-medium",
											current || done ? "text-gray-800" : "text-gray-400",
										)}
									>
										{step.label}
										{done && <span className="sr-only"> (completed)</span>}
										{current && <span className="sr-only"> (current)</span>}
									</p>
									<p className="typo-t4 text-gray-500">{step.hint}</p>
								</div>
							</li>
						);
					})}
				</ol>
			)}

			<section
				aria-labelledby="order-details"
				className="rounded-xl border border-gray-border-200 p-5"
			>
				<h2 id="order-details" className="typo-h6 mb-3 text-gray-800">
					Order details
				</h2>
				<ul className="flex flex-col gap-1">
					{order.items.map((item) => (
						<li
							key={item.menuItemId}
							className="typo-t3 flex justify-between text-gray-700"
						>
							<span>
								{item.quantity} × {item.name}
							</span>
							<span>{formatPrice(item.priceCents * item.quantity)}</span>
						</li>
					))}
				</ul>
				<p className="typo-t1 mt-3 flex justify-between border-t border-gray-border-200 pt-3 font-semibold text-gray-800">
					<span>Total</span>
					<span>{formatPrice(order.totalCents)}</span>
				</p>
				<dl className="typo-t4 mt-4 grid gap-1 text-gray-600">
					<div className="flex gap-2">
						<dt className="font-medium">Name:</dt>
						<dd>{order.customerName}</dd>
					</div>
					<div className="flex gap-2">
						<dt className="font-medium">Address:</dt>
						<dd>{order.address}</dd>
					</div>
					<div className="flex gap-2">
						<dt className="font-medium">Phone:</dt>
						<dd>{order.phone}</dd>
					</div>
				</dl>
			</section>
		</div>
	);
}

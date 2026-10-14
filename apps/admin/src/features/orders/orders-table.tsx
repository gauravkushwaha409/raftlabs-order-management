import { Badge, Button } from "@package/ui";
import { Trash2Icon } from "lucide-react";
import { formatPrice } from "@/lib/money";
import type { Order, OrderStatus } from "@/types/api";
import { NEXT_STATUSES, STATUS_BADGE, STATUS_LABEL } from "./order-status";

interface OrdersTableProps {
	orders: Order[];
	onStatusChange: (order: Order, status: OrderStatus) => void;
	onDelete: (order: Order) => void;
	busyOrderId?: string | null;
}

const shortId = (id: string) => id.slice(0, 8).toUpperCase();

export function OrdersTable({
	orders,
	onStatusChange,
	onDelete,
	busyOrderId,
}: OrdersTableProps) {
	if (orders.length === 0) {
		return (
			<p className="typo-t2 py-16 text-center text-gray-500">No orders yet.</p>
		);
	}

	return (
		<div className="overflow-x-auto rounded-xl border border-gray-border-200">
			<table className="w-full text-left">
				<thead className="typo-t4 bg-gray-fill-50 text-gray-600">
					<tr>
						<th scope="col" className="px-4 py-3 font-medium">
							Order
						</th>
						<th scope="col" className="px-4 py-3 font-medium">
							Customer
						</th>
						<th scope="col" className="px-4 py-3 font-medium">
							Items
						</th>
						<th scope="col" className="px-4 py-3 font-medium">
							Total
						</th>
						<th scope="col" className="px-4 py-3 font-medium">
							Status
						</th>
						<th scope="col" className="px-4 py-3 font-medium">
							Actions
						</th>
					</tr>
				</thead>
				<tbody className="typo-t3 divide-y divide-gray-border-200 text-gray-700">
					{orders.map((order) => {
						const next = NEXT_STATUSES[order.status];
						return (
							<tr key={order.id}>
								<td className="px-4 py-3 align-top">
									<p className="font-medium text-gray-800">#{shortId(order.id)}</p>
									<p className="typo-t5 text-gray-500">
										{new Date(order.createdAt).toLocaleString()}
									</p>
								</td>
								<td className="px-4 py-3 align-top">
									<p className="font-medium text-gray-800">{order.customerName}</p>
									<p className="typo-t5 text-gray-500">{order.phone}</p>
									<p className="typo-t5 text-gray-500">{order.address}</p>
								</td>
								<td className="px-4 py-3 align-top">
									<ul>
										{order.items.map((item) => (
											<li key={item.menuItemId}>
												{item.quantity} × {item.name}
											</li>
										))}
									</ul>
								</td>
								<td className="px-4 py-3 align-top font-medium">
									{formatPrice(order.totalCents)}
								</td>
								<td className="px-4 py-3 align-top">
									<Badge variant={STATUS_BADGE[order.status]}>
										{STATUS_LABEL[order.status]}
									</Badge>
								</td>
								<td className="px-4 py-3 align-top">
									<div className="flex items-center gap-2">
										{next.length > 0 && (
											<select
												aria-label={`Change status of order ${shortId(order.id)}`}
												className="typo-t4 h-9 rounded-md border border-gray-border-200 bg-white-base px-2"
												value=""
												disabled={busyOrderId === order.id}
												onChange={(event) =>
													onStatusChange(order, event.target.value as OrderStatus)
												}
											>
												<option value="" disabled>
													Move to…
												</option>
												{next.map((status) => (
													<option key={status} value={status}>
														{STATUS_LABEL[status]}
													</option>
												))}
											</select>
										)}
										<Button
											variant="ghost"
											size="icon-xs"
											className="w-[34px]"
											icon={Trash2Icon}
											aria-label={`Delete order ${shortId(order.id)}`}
											disabled={busyOrderId === order.id}
											onClick={() => onDelete(order)}
										/>
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

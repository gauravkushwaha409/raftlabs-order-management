import { Badge, Button, type ColumnDef } from "@package/ui";
import { Trash2Icon } from "lucide-react";
import { Table } from "@/components/shared/table";
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
	const columns: ColumnDef<Order>[] = [
		{
			id: "order",
			header: "Order",
			size: 180,
			cell: ({ row }) => {
				const order = row.original;
				return (
					<div>
						<p className="font-medium text-gray-800">#{shortId(order.id)}</p>
						<p className="typo-t5 text-gray-500">
							{new Date(order.createdAt).toLocaleString()}
						</p>
					</div>
				);
			},
		},
		{
			id: "customer",
			header: "Customer",
			size: 220,
			cell: ({ row }) => {
				const order = row.original;
				return (
					<div>
						<p className="font-medium text-gray-800">{order.customerName}</p>
						<p className="typo-t5 text-gray-500">{order.phone}</p>
						<p className="typo-t5 text-gray-500">{order.address}</p>
					</div>
				);
			},
		},
		{
			id: "items",
			header: "Items",
			size: 220,
			cell: ({ row }) => {
				const order = row.original;
				return (
					<ul>
						{order.items.map((item) => (
							<li key={item.menuItemId}>
								{item.quantity} × {item.name}
							</li>
						))}
					</ul>
				);
			},
		},
		{
			id: "total",
			header: "Total",
			size: 110,
			cell: ({ row }) => (
				<span className="font-medium">{formatPrice(row.original.totalCents)}</span>
			),
		},
		{
			id: "status",
			header: "Status",
			size: 160,
			cell: ({ row }) => {
				const order = row.original;
				return (
					<Badge variant={STATUS_BADGE[order.status]}>
						{STATUS_LABEL[order.status]}
					</Badge>
				);
			},
		},
		{
			id: "actions",
			header: "Actions",
			size: 210,
			cell: ({ row }) => {
				const order = row.original;
				const next = NEXT_STATUSES[order.status];
				const busy = busyOrderId === order.id;
				return (
					<div className="flex items-center gap-2">
						{next.length > 0 && (
							<select
								aria-label={`Change status of order ${shortId(order.id)}`}
								className="typo-t4 h-9 rounded-md border border-gray-border-200 bg-white-base px-2"
								value=""
								disabled={busy}
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
							disabled={busy}
							onClick={() => onDelete(order)}
						/>
					</div>
				);
			},
		},
	];

	return (
		<Table
			data={orders}
			columns={columns}
			getRowId={(order) => order.id}
			emptyState={
				<p className="typo-t2 py-16 text-center text-gray-500">No orders yet.</p>
			}
		/>
	);
}

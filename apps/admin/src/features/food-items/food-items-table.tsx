import { Badge, Button, type ColumnDef } from "@package/ui";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { Table } from "@/components/shared/table";
import { formatPrice } from "@/lib/money";
import type { MenuItem } from "@/types/api";

interface FoodItemsTableProps {
	items: MenuItem[];
	onEdit: (item: MenuItem) => void;
	onDelete: (item: MenuItem) => void;
	busyItemId?: string | null;
}

export function FoodItemsTable({
	items,
	onEdit,
	onDelete,
	busyItemId,
}: FoodItemsTableProps) {
	const columns: ColumnDef<MenuItem>[] = [
		{
			id: "item",
			header: "Item",
			size: 260,
			cell: ({ row }) => {
				const item = row.original;
				return (
					<div className="flex min-w-0 items-center gap-3">
						{item.image ? (
							<img
								src={item.image}
								alt=""
								loading="lazy"
								className="size-9 shrink-0 rounded-lg border border-gray-border-200 object-cover"
							/>
						) : (
							<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-sm font-semibold text-primary-600 uppercase">
								{item.name.charAt(0)}
							</span>
						)}
						<div className="flex min-w-0 flex-col">
							<p className="truncate font-medium text-gray-800">{item.name}</p>
							<p className="typo-t5 truncate text-gray-500">
								{item.description || "No description"}
							</p>
						</div>
					</div>
				);
			},
		},
		{
			id: "category",
			header: "Category",
			size: 140,
			cell: ({ row }) => <span>{row.original.category}</span>,
		},
		{
			id: "price",
			header: "Price",
			size: 110,
			cell: ({ row }) => (
				<span className="font-medium">{formatPrice(row.original.priceCents)}</span>
			),
		},
		{
			id: "availability",
			header: "Availability",
			size: 140,
			cell: ({ row }) => {
				const item = row.original;
				return (
					<Badge variant={item.available ? "success" : "warning"}>
						{item.available ? "Available" : "Unavailable"}
					</Badge>
				);
			},
		},
		{
			id: "actions",
			header: "Actions",
			size: 120,
			cell: ({ row }) => {
				const item = row.original;
				const busy = busyItemId === item.id;
				return (
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon-xs"
							className="w-[34px]"
							icon={PencilIcon}
							aria-label={`Edit food item ${item.name}`}
							disabled={busy}
							onClick={() => onEdit(item)}
						/>
						<Button
							variant="ghost"
							size="icon-xs"
							className="w-[34px]"
							icon={Trash2Icon}
							aria-label={`Delete food item ${item.name}`}
							disabled={busy}
							onClick={() => onDelete(item)}
						/>
					</div>
				);
			},
		},
	];

	return (
		<Table
			data={items}
			columns={columns}
			getRowId={(item) => item.id}
			emptyState={
				<p className="typo-t2 py-16 text-center text-gray-500">
					No food items yet.
				</p>
			}
		/>
	);
}

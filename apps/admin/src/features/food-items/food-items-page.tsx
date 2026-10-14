import { Button } from "@package/ui";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useLogout } from "@/features/auth/session";
import {
	useDeleteMenuItemMutation,
	useSaveMenuItemMutation,
} from "@/features/food-items/hooks/mutations/use-menu-item.mutations";
import { useMenuItemsQuery } from "@/features/food-items/hooks/queries/use-menu-items.query";
import type { MenuItem } from "@/types/api";
import { FoodItemDialog } from "./food-item-dialog";
import { FoodItemsTable } from "./food-items-table";

export function FoodItemsPage() {
	const { mutate: signOut } = useLogout();
	const [dialog, setDialog] = useState<{ item: MenuItem | null } | null>(null);

	const items = useMenuItemsQuery();

	const save = useSaveMenuItemMutation(signOut);
	const remove = useDeleteMenuItemMutation(signOut);

	const mutationError = save.error ?? remove.error;
	const busyItemId = save.isPending
		? (save.variables?.item?.id ?? "new")
		: remove.isPending
			? remove.variables?.id
			: null;

	return (
		<div className="flex flex-col gap-4">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<h2 className="typo-h4 text-gray-800">Food Items</h2>
					{items.data && (
						<span className="typo-t5 rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-500">
							{items.data.length} items
						</span>
					)}
				</div>
				<Button
					className="w-auto"
					icon={PlusIcon}
					onClick={() => setDialog({ item: null })}
				>
					Add item
				</Button>
			</header>

			{mutationError && (
				<p
					role="alert"
					className="typo-t3 rounded-lg bg-alert-25 p-3 text-alert-600"
				>
					{mutationError.message}
				</p>
			)}

			{items.isPending ? (
				<div
					role="status"
					aria-label="Loading food items"
					className="h-48 animate-pulse rounded-xl bg-gray-100"
				/>
			) : items.isError ? (
				<div
					role="alert"
					className="flex flex-col items-center gap-3 py-12 text-center"
				>
					<p className="typo-t2 text-gray-800">
						Couldn't load food items: {items.error.message}
					</p>
					<Button
						className="w-auto"
						variant="secondary"
						onClick={() => items.refetch()}
					>
						Try again
					</Button>
				</div>
			) : (
				<FoodItemsTable
					items={items.data ?? []}
					busyItemId={busyItemId}
					onEdit={(item) => setDialog({ item })}
					onDelete={(item) => {
						if (
							window.confirm(
								`Delete "${item.name}"? Items in existing orders cannot be deleted.`,
							)
						)
							remove.mutate(item);
					}}
				/>
			)}

			{dialog && (
				<FoodItemDialog
					open
					item={dialog.item}
					isPending={save.isPending}
					onOpenChange={(open) => {
						if (!open) setDialog(null);
					}}
					onSubmit={(input) =>
						save.mutate(
							{ item: dialog.item, input },
							{ onSuccess: () => setDialog(null) },
						)
					}
				/>
			)}
		</div>
	);
}

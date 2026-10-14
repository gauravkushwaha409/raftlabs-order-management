import { useMutation, useQuery } from "@package/query";
import { Button } from "@package/ui";
import { useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useLogout } from "@/features/auth/session";
import {
	ApiError,
	createMenuItem,
	deleteMenuItem,
	listMenuItems,
	updateMenuItem,
} from "@/lib/api";
import type { MenuItem, MenuItemInput } from "@/types/api";
import { FoodItemDialog } from "./food-item-dialog";
import { FoodItemsTable } from "./food-items-table";

const MENU_ITEMS_QUERY_KEY = ["menu-items"];

export function FoodItemsPage() {
	const { mutate: signOut } = useLogout();
	const queryClient = useQueryClient();
	const [dialog, setDialog] = useState<{ item: MenuItem | null } | null>(null);
	const [busyItemId, setBusyItemId] = useState<string | null>(null);

	const signOutIfUnauthorized = (error: Error | null) => {
		if (
			error instanceof ApiError &&
			(error.status === 401 || error.status === 403)
		)
			signOut();
	};

	const items = useQuery(MENU_ITEMS_QUERY_KEY, listMenuItems, undefined, {
		refetchOnMount: "always",
	});

	const save = useMutation(
		({ item, input }: { item: MenuItem | null; input: MenuItemInput }) =>
			item ? updateMenuItem(item.id, input) : createMenuItem(input),
		{
			onMutate: ({ item }) => setBusyItemId(item?.id ?? "new"),
			onSuccess: (saved) => {
				queryClient.setQueryData<MenuItem[]>(MENU_ITEMS_QUERY_KEY, (cached) => {
					if (!cached) return [saved];
					if (cached.some((entry) => entry.id === saved.id))
						return cached.map((entry) => (entry.id === saved.id ? saved : entry));
					return [...cached, saved];
				});
				setDialog(null);
			},
			onError: signOutIfUnauthorized,
			onSettled: () => setBusyItemId(null),
		},
	);

	const remove = useMutation(
		(item: MenuItem) => deleteMenuItem(item.id).then(() => item),
		{
			onMutate: (item) => setBusyItemId(item.id),
			onSuccess: (deleted) => {
				queryClient.setQueryData<MenuItem[]>(MENU_ITEMS_QUERY_KEY, (cached) =>
					cached?.filter((entry) => entry.id !== deleted.id),
				);
			},
			onError: signOutIfUnauthorized,
			onSettled: () => setBusyItemId(null),
		},
	);

	const mutationError = save.error ?? remove.error;

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
					onSubmit={(input) => save.mutate({ item: dialog.item, input })}
				/>
			)}
		</div>
	);
}

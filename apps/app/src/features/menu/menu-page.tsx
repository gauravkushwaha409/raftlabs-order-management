import { useQuery } from "@package/query";
import { Button } from "@package/ui";
import { useState } from "react";
import { getMenu } from "@/lib/api";
import { useCart } from "@/stores/cart.store";
import { MenuCard } from "./menu-card";

const ALL = "All";

export function MenuPage() {
	const menu = useQuery(["menu"], getMenu);
	const [category, setCategory] = useState(ALL);
	const { add } = useCart.getState();

	if (menu.isPending) {
		return (
			<div
				role="status"
				aria-label="Loading menu"
				className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
			>
				{Array.from({ length: 6 }, (_, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
					<div key={index} className="h-72 animate-pulse rounded-xl bg-gray-100" />
				))}
			</div>
		);
	}

	if (menu.isError) {
		return (
			<div
				role="alert"
				className="flex flex-col items-center gap-3 py-16 text-center"
			>
				<p className="typo-t1 text-gray-800">We couldn't load the menu.</p>
				<p className="typo-t4 text-gray-500">{menu.error.message}</p>
				<Button
					className="w-auto"
					variant="secondary"
					onClick={() => menu.refetch()}
				>
					Try again
				</Button>
			</div>
		);
	}

	const categories = [...new Set(menu.data.map((item) => item.category))];
	const visible = menu.data.filter(
		(item) => category === ALL || item.category === category,
	);

	return (
		<div className="flex flex-col gap-6">
			<fieldset className="flex flex-wrap gap-2">
				<legend className="sr-only">Filter by category</legend>
				{[ALL, ...categories].map((name) => (
					<Button
						key={name}
						size="sm"
						className="w-auto"
						variant={name === category ? "default" : "secondary"}
						aria-pressed={name === category}
						onClick={() => setCategory(name)}
					>
						{name}
					</Button>
				))}
			</fieldset>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{visible.map((item) => (
					<MenuCard key={item.id} item={item} onAdd={add} />
				))}
			</div>
		</div>
	);
}

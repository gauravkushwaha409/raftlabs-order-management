import { Badge, Button } from "@package/ui";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, CheckIcon, ShoppingBagIcon } from "lucide-react";
import { formatPrice } from "@/lib/money";
import { useCart } from "@/stores/cart.store";
import { useMenuQuery } from "./hooks/queries/use-menu.query";

export function MenuDetailsPage({ itemId }: { itemId: string }) {
	const menu = useMenuQuery();
	const inCart = useCart((state) =>
		state.lines.some((line) => line.item.id === itemId),
	);
	const { add } = useCart.getState();

	if (menu.isPending) {
		return (
			<div
				role="status"
				aria-label="Loading food item"
				className="grid gap-6 md:grid-cols-2"
			>
				<div className="aspect-[4/3] animate-pulse rounded-xl bg-gray-100" />
				<div className="flex flex-col gap-3">
					<div className="h-8 w-2/3 animate-pulse rounded bg-gray-100" />
					<div className="h-5 w-1/3 animate-pulse rounded bg-gray-100" />
					<div className="h-20 animate-pulse rounded bg-gray-100" />
				</div>
			</div>
		);
	}

	if (menu.isError) {
		return (
			<div
				role="alert"
				className="flex flex-col items-center gap-3 py-16 text-center"
			>
				<p className="typo-t1 text-gray-800">We couldn't load this dish.</p>
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

	const item = menu.data.find((entry) => entry.id === itemId);

	if (!item) {
		return (
			<div className="flex flex-col items-center gap-3 py-16 text-center">
				<p className="typo-t1 text-gray-800">Dish not available.</p>
				<p className="typo-t4 text-gray-500">
					It may have been removed from the menu.
				</p>
				<Link to="/">
					<Button variant="secondary" className="w-auto" leftIcon={ArrowLeftIcon}>
						Back to menu
					</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<Link
				to="/"
				className="typo-t4 inline-flex w-fit items-center gap-1.5 text-gray-500 hover:text-gray-800"
			>
				<ArrowLeftIcon size={16} />
				Back to menu
			</Link>
			<div className="grid gap-6 md:grid-cols-2">
				<img
					src={item.image}
					alt={item.name}
					className="aspect-[4/3] w-full rounded-xl border border-gray-border-200 bg-gray-100 object-cover"
				/>
				<div className="flex flex-col gap-3">
					<Badge variant="info" className="w-fit">
						{item.category}
					</Badge>
					<div className="flex items-start justify-between gap-3">
						<h1 className="typo-h3 text-gray-800">{item.name}</h1>
						<p className="typo-h4 text-primary-500">{formatPrice(item.priceCents)}</p>
					</div>
					<p className="typo-t2 text-gray-500">{item.description}</p>
					<div className="mt-2 flex flex-wrap items-center gap-3">
						{inCart ? (
							<Button
								className="w-auto"
								variant="secondary"
								leftIcon={CheckIcon}
								aria-label={`${item.name} is already in the cart`}
								disabled
							>
								In cart
							</Button>
						) : (
							<Button
								className="w-auto"
								leftIcon={ShoppingBagIcon}
								aria-label={`Add ${item.name} to cart`}
								onClick={() => add(item)}
							>
								Add to cart
							</Button>
						)}
						<p className="typo-t5 text-gray-500">
							Adjust quantity anytime from the cart.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

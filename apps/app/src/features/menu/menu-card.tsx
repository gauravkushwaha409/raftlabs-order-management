import { Button } from "@package/ui";
import { Link } from "@tanstack/react-router";
import { CheckIcon, ShoppingBagIcon } from "lucide-react";
import { formatPrice } from "@/lib/money";
import type { MenuItem } from "@/types/api";

interface MenuCardProps {
	item: MenuItem;
	/** True when the item is already in the cart; shows an "In cart" state instead. */
	inCart?: boolean;
	onAdd: (item: MenuItem) => void;
}

export function MenuCard({ item, inCart = false, onAdd }: MenuCardProps) {
	return (
		<article className="flex flex-col overflow-hidden rounded-xl border border-gray-border-200 bg-white-base">
			<Link
				to="/menu/$itemId"
				params={{ itemId: item.id }}
				aria-label={`View ${item.name}`}
				className="block"
			>
				<img
					src={item.image}
					alt={item.name}
					loading="lazy"
					className="aspect-[4/3] w-full bg-gray-100 object-cover"
				/>
			</Link>
			<div className="flex flex-1 flex-col gap-1 p-4">
				<div className="flex items-start justify-between gap-3">
					<Link
						to="/menu/$itemId"
						params={{ itemId: item.id }}
						className="typo-t1 font-semibold text-gray-800 hover:text-primary-500"
					>
						<h3>{item.name}</h3>
					</Link>
					<p className="typo-t1 font-semibold text-primary-500">
						{formatPrice(item.priceCents)}
					</p>
				</div>
				<p className="typo-t4 flex-1 text-gray-500">{item.description}</p>
				<div className="mt-3">
					{inCart ? (
						<Button
							size="sm"
							variant="secondary"
							leftIcon={CheckIcon}
							aria-label={`${item.name} is already in the cart`}
							disabled
						>
							In cart
						</Button>
					) : (
						<Button
							size="sm"
							leftIcon={ShoppingBagIcon}
							aria-label={`Add ${item.name} to cart`}
							onClick={() => onAdd(item)}
						>
							Add to cart
						</Button>
					)}
				</div>
			</div>
		</article>
	);
}

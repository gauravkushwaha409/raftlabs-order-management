import { Button } from "@package/ui";
import { ShoppingBagIcon } from "lucide-react";
import { QuantityStepper } from "@/components/quantity-stepper";
import { formatPrice } from "@/lib/money";
import type { MenuItem } from "@/types/api";

interface MenuCardProps {
	item: MenuItem;
	/** How many are in the cart; 0 shows the add button, otherwise a stepper. */
	quantity: number;
	onAdd: (item: MenuItem) => void;
	onQuantityChange: (item: MenuItem, quantity: number) => void;
}

export function MenuCard({
	item,
	quantity,
	onAdd,
	onQuantityChange,
}: MenuCardProps) {
	return (
		<article className="flex flex-col overflow-hidden rounded-xl border border-gray-border-200 bg-white-base">
			<img
				src={item.image}
				alt={item.name}
				loading="lazy"
				className="aspect-[4/3] w-full bg-gray-100 object-cover"
			/>
			<div className="flex flex-1 flex-col gap-1 p-4">
				<div className="flex items-start justify-between gap-3">
					<h3 className="typo-t1 font-semibold text-gray-800">{item.name}</h3>
					<p className="typo-t1 font-semibold text-primary-500">
						{formatPrice(item.priceCents)}
					</p>
				</div>
				<p className="typo-t4 flex-1 text-gray-500">{item.description}</p>
				<div className="mt-3">
					{quantity === 0 ? (
						<Button
							size="sm"
							leftIcon={ShoppingBagIcon}
							aria-label={`Add ${item.name} to cart`}
							onClick={() => onAdd(item)}
						>
							Add to cart
						</Button>
					) : (
						<QuantityStepper
							label={item.name}
							quantity={quantity}
							onChange={(next) => onQuantityChange(item, next)}
						/>
					)}
				</div>
			</div>
		</article>
	);
}

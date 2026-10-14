import { Button } from "@package/ui";
import { Trash2Icon } from "lucide-react";
import { QuantityStepper } from "@/components/quantity-stepper";
import { formatPrice } from "@/lib/money";
import { type CartLine, useCart } from "@/stores/cart.store";

export function CartLines({ lines }: { lines: CartLine[] }) {
	const { setQuantity, remove } = useCart.getState();

	return (
		<ul className="flex flex-col divide-y divide-gray-border-200">
			{lines.map(({ item, quantity }) => (
				<li key={item.id} className="flex items-center gap-3 py-3">
					<img
						src={item.image}
						alt=""
						className="size-14 shrink-0 rounded-lg bg-gray-100 object-cover"
					/>
					<div className="flex min-w-0 flex-1 flex-col gap-1">
						<p className="typo-t3 truncate font-medium text-gray-800">{item.name}</p>
						<p className="typo-t4 text-gray-500">
							{formatPrice(item.priceCents * quantity)}
						</p>
						<QuantityStepper
							label={item.name}
							quantity={quantity}
							onChange={(next) => setQuantity(item.id, next)}
						/>
					</div>
					<Button
						variant="ghost"
						size="icon-xs"
						className="w-[34px]"
						aria-label={`Remove ${item.name}`}
						icon={Trash2Icon}
						onClick={() => remove(item.id)}
					/>
				</li>
			))}
		</ul>
	);
}

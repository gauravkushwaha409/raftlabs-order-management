import { useMutation } from "@package/query";
import { Button } from "@package/ui";
import { Link, useNavigate } from "@tanstack/react-router";
import { createOrder } from "@/lib/api";
import { formatPrice } from "@/lib/money";
import { cartTotalCents, useCart } from "@/stores/cart.store";
import { CartLines } from "../cart/cart-lines";
import { CheckoutForm } from "./checkout-form";

export function CheckoutPage() {
	const navigate = useNavigate();
	const lines = useCart((state) => state.lines);
	const place = useMutation(createOrder, {
		onSuccess: (order) => {
			useCart.getState().clear();
			void navigate({ to: "/orders/$orderId", params: { orderId: order.id } });
		},
	});

	if (lines.length === 0 && !place.isSuccess) {
		return (
			<div className="flex flex-col items-center gap-4 py-16 text-center">
				<p className="typo-t1 text-gray-800">Your cart is empty.</p>
				<Link to="/">
					<Button className="w-auto" variant="secondary">
						Browse the menu
					</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="grid gap-8 lg:grid-cols-[1fr_380px]">
			<section
				aria-labelledby="delivery-heading"
				className="rounded-xl border border-gray-border-200 p-5"
			>
				<h2 id="delivery-heading" className="typo-h5 mb-4 text-gray-800">
					Delivery details
				</h2>
				<CheckoutForm
					isPending={place.isPending}
					error={place.error?.message ?? null}
					onSubmit={(values) =>
						place.mutate({
							...values,
							items: lines.map((line) => ({
								menuItemId: line.item.id,
								quantity: line.quantity,
							})),
						})
					}
				/>
			</section>
			<aside
				aria-labelledby="summary-heading"
				className="h-fit rounded-xl border border-gray-border-200 p-5"
			>
				<h2 id="summary-heading" className="typo-h5 mb-2 text-gray-800">
					Order summary
				</h2>
				<CartLines lines={lines} />
				<div className="mt-3 flex items-center justify-between border-t border-gray-border-200 pt-3">
					<span className="typo-t2 text-gray-600">Total</span>
					<span className="typo-t1 font-semibold text-gray-800">
						{formatPrice(cartTotalCents(lines))}
					</span>
				</div>
			</aside>
		</div>
	);
}

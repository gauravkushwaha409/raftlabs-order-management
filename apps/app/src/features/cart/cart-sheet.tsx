import {
	Button,
	Sheet,
	SheetBody,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@package/ui";
import { useNavigate } from "@tanstack/react-router";
import { ShoppingCartIcon } from "lucide-react";
import { useState } from "react";
import { formatPrice } from "@/lib/money";
import { cartCount, cartTotalCents, useCart } from "@/stores/cart.store";
import { CartLines } from "./cart-lines";

export function CartSheet() {
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();
	const lines = useCart((state) => state.lines);
	const count = cartCount(lines);

	const checkout = () => {
		setOpen(false);
		void navigate({ to: "/checkout" });
	};

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button
					variant="secondary"
					size="sm"
					className="relative w-auto"
					aria-label={`Open cart, ${count} items`}
				>
					<ShoppingCartIcon />
					<span aria-hidden>Cart</span>
					{count > 0 && (
						<span
							aria-hidden
							className="typo-t5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1 text-white-base"
						>
							{count}
						</span>
					)}
				</Button>
			</SheetTrigger>
			<SheetContent size="md">
				<SheetHeader>
					<SheetTitle>Your cart</SheetTitle>
					<SheetDescription>
						{count === 0
							? "Nothing here yet"
							: `${count} item${count === 1 ? "" : "s"}`}
					</SheetDescription>
				</SheetHeader>
				<SheetBody className="px-4">
					{lines.length === 0 ? (
						<p className="typo-t3 py-16 text-center text-gray-500">
							Add something tasty from the menu.
						</p>
					) : (
						<CartLines lines={lines} />
					)}
				</SheetBody>
				<SheetFooter>
					<div className="flex w-full items-center justify-between">
						<span className="typo-t2 text-gray-600">Subtotal</span>
						<span className="typo-t1 font-semibold text-gray-800">
							{formatPrice(cartTotalCents(lines))}
						</span>
					</div>
					<Button disabled={lines.length === 0} onClick={checkout}>
						Checkout
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MenuItem } from "@/types/api";

export const MAX_QUANTITY = 20; // keep in sync with the API's per-line limit

export interface CartLine {
	item: MenuItem;
	quantity: number;
}

interface CartState {
	lines: CartLine[];
	add: (item: MenuItem) => void;
	setQuantity: (itemId: string, quantity: number) => void;
	remove: (itemId: string) => void;
	clear: () => void;
}

export const useCart = create<CartState>()(
	persist(
		(set) => ({
			lines: [],
			add: (item) =>
				set(({ lines }) => {
					const existing = lines.find((line) => line.item.id === item.id);
					if (!existing) return { lines: [...lines, { item, quantity: 1 }] };
					return {
						lines: lines.map((line) =>
							line.item.id === item.id
								? { ...line, quantity: Math.min(line.quantity + 1, MAX_QUANTITY) }
								: line,
						),
					};
				}),
			setQuantity: (itemId, quantity) =>
				set(({ lines }) => ({
					lines:
						quantity <= 0
							? lines.filter((line) => line.item.id !== itemId)
							: lines.map((line) =>
									line.item.id === itemId
										? { ...line, quantity: Math.min(Math.floor(quantity), MAX_QUANTITY) }
										: line,
								),
				})),
			remove: (itemId) =>
				set(({ lines }) => ({
					lines: lines.filter((line) => line.item.id !== itemId),
				})),
			clear: () => set({ lines: [] }),
		}),
		{ name: "raftlabs-cart" },
	),
);

export const cartCount = (lines: CartLine[]) =>
	lines.reduce((sum, line) => sum + line.quantity, 0);
export const cartTotalCents = (lines: CartLine[]) =>
	lines.reduce((sum, line) => sum + line.item.priceCents * line.quantity, 0);

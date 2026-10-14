import type { MenuItem } from "@/types/api";
import { cartCount, cartTotalCents, MAX_QUANTITY, useCart } from "./cart.store";

const pizza: MenuItem = {
	id: "pizza",
	name: "Pizza",
	description: "",
	priceCents: 1000,
	image: "",
	category: "Pizza",
};
const soda: MenuItem = {
	id: "soda",
	name: "Soda",
	description: "",
	priceCents: 250,
	image: "",
	category: "Drinks",
};

describe("cart store", () => {
	beforeEach(() => {
		useCart.setState({ lines: [] });
		localStorage.clear();
	});

	it("adds new items with quantity 1 and ignores repeats", () => {
		const { add } = useCart.getState();
		add(pizza);
		add(pizza);
		add(soda);
		expect(useCart.getState().lines).toEqual([
			{ item: pizza, quantity: 1 },
			{ item: soda, quantity: 1 },
		]);
	});

	it("caps the quantity at the API limit", () => {
		const { add, setQuantity } = useCart.getState();
		add(pizza);
		setQuantity("pizza", 999);
		expect(useCart.getState().lines[0]?.quantity).toBe(MAX_QUANTITY);
		add(pizza);
		expect(useCart.getState().lines[0]?.quantity).toBe(MAX_QUANTITY);
	});

	it("sets a quantity and removes the line when it drops to zero", () => {
		const { add, setQuantity } = useCart.getState();
		add(pizza);
		setQuantity("pizza", 3);
		expect(useCart.getState().lines[0]?.quantity).toBe(3);
		setQuantity("pizza", 0);
		expect(useCart.getState().lines).toEqual([]);
	});

	it("removes and clears", () => {
		const { add, remove, clear } = useCart.getState();
		add(pizza);
		add(soda);
		remove("pizza");
		expect(useCart.getState().lines.map((line) => line.item.id)).toEqual([
			"soda",
		]);
		clear();
		expect(useCart.getState().lines).toEqual([]);
	});

	it("derives count and total", () => {
		const lines = [
			{ item: pizza, quantity: 2 },
			{ item: soda, quantity: 1 },
		];
		expect(cartCount(lines)).toBe(3);
		expect(cartTotalCents(lines)).toBe(2250);
	});

	it("persists to localStorage", () => {
		useCart.getState().add(pizza);
		expect(localStorage.getItem("raftlabs-cart")).toContain("pizza");
	});
});

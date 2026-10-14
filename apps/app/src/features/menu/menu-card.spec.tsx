import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MenuItem } from "@/types/api";
import { MenuCard } from "./menu-card";

const item: MenuItem = {
	id: "pizza",
	name: "Margherita Pizza",
	description: "Tomato, mozzarella and basil.",
	priceCents: 1299,
	image: "https://example.com/pizza.jpg",
	category: "Pizza",
};

describe("MenuCard", () => {
	it("shows name, description, price and image", () => {
		render(
			<MenuCard
				item={item}
				quantity={0}
				onAdd={vi.fn()}
				onQuantityChange={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("heading", { name: "Margherita Pizza" }),
		).toBeInTheDocument();
		expect(screen.getByText("Tomato, mozzarella and basil.")).toBeInTheDocument();
		expect(screen.getByText("$12.99")).toBeInTheDocument();
		expect(screen.getByRole("img", { name: "Margherita Pizza" })).toHaveAttribute(
			"src",
			item.image,
		);
	});

	it("adds the item to the cart", async () => {
		const onAdd = vi.fn();
		render(
			<MenuCard
				item={item}
				quantity={0}
				onAdd={onAdd}
				onQuantityChange={vi.fn()}
			/>,
		);

		await userEvent.click(
			screen.getByRole("button", { name: "Add Margherita Pizza to cart" }),
		);

		expect(onAdd).toHaveBeenCalledWith(item);
	});

	it("shows a quantity stepper once the item is in the cart", async () => {
		const onQuantityChange = vi.fn();
		render(
			<MenuCard
				item={item}
				quantity={2}
				onAdd={vi.fn()}
				onQuantityChange={onQuantityChange}
			/>,
		);

		expect(
			screen.queryByRole("button", { name: /add .* to cart/i }),
		).not.toBeInTheDocument();
		expect(screen.getByText("2")).toBeInTheDocument();

		await userEvent.click(
			screen.getByRole("button", {
				name: "Increase quantity of Margherita Pizza",
			}),
		);
		await userEvent.click(
			screen.getByRole("button", {
				name: "Decrease quantity of Margherita Pizza",
			}),
		);

		expect(onQuantityChange).toHaveBeenNthCalledWith(1, item, 3);
		expect(onQuantityChange).toHaveBeenNthCalledWith(2, item, 1);
	});

	it("stops increasing at the maximum quantity", () => {
		render(
			<MenuCard
				item={item}
				quantity={20}
				onAdd={vi.fn()}
				onQuantityChange={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("button", {
				name: "Increase quantity of Margherita Pizza",
			}),
		).toBeDisabled();
	});
});

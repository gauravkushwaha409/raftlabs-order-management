import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
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

async function renderWithRouter(ui: ReactNode) {
	const rootRoute = createRootRoute({ component: () => <>{ui}</> });
	const router = createRouter({
		routeTree: rootRoute,
		history: createMemoryHistory({ initialEntries: ["/"] }),
	});
	await router.load();
	return render(<RouterProvider router={router} />);
}

describe("MenuCard", () => {
	it("shows name, description, price and image", async () => {
		await renderWithRouter(<MenuCard item={item} onAdd={vi.fn()} />);

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
		await renderWithRouter(<MenuCard item={item} onAdd={onAdd} />);

		await userEvent.click(
			screen.getByRole("button", { name: "Add Margherita Pizza to cart" }),
		);

		expect(onAdd).toHaveBeenCalledWith(item);
	});

	it("never shows a quantity stepper on the list", async () => {
		await renderWithRouter(<MenuCard item={item} onAdd={vi.fn()} />);

		expect(
			screen.queryByRole("button", { name: /quantity of/i }),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Add Margherita Pizza to cart" }),
		).toBeInTheDocument();
	});

	it("links to the food details page", async () => {
		await renderWithRouter(<MenuCard item={item} onAdd={vi.fn()} />);

		expect(
			screen.getByRole("link", { name: "View Margherita Pizza" }),
		).toHaveAttribute("href", "/menu/pizza");
	});
});

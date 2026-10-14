import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { getMenu } from "@/lib/api";
import { useCart } from "@/stores/cart.store";
import type { MenuItem } from "@/types/api";
import { MenuDetailsPage } from "./menu-details-page";

vi.mock("@/lib/api", () => ({ getMenu: vi.fn() }));

const menu: MenuItem[] = [
	{
		id: "pizza",
		name: "Margherita",
		description: "Tomato, mozzarella and basil.",
		priceCents: 1299,
		image: "https://example.com/pizza.jpg",
		category: "Pizza",
	},
];

async function renderWithRouter(ui: ReactNode) {
	const rootRoute = createRootRoute({
		component: () => (
			<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>
		),
	});
	const router = createRouter({
		routeTree: rootRoute,
		history: createMemoryHistory({ initialEntries: ["/menu/pizza"] }),
	});
	await router.load();
	return render(<RouterProvider router={router} />);
}

describe("MenuDetailsPage", () => {
	beforeEach(() => {
		useCart.setState({ lines: [] });
		vi.mocked(getMenu).mockReset();
	});

	it("shows the food details and adds it to the cart", async () => {
		vi.mocked(getMenu).mockResolvedValue(menu);
		await renderWithRouter(<MenuDetailsPage itemId="pizza" />);
		const user = userEvent.setup();

		expect(
			await screen.findByRole("heading", { name: "Margherita" }),
		).toBeInTheDocument();
		expect(screen.getByText("Tomato, mozzarella and basil.")).toBeInTheDocument();
		expect(screen.getByText("$12.99")).toBeInTheDocument();
		expect(screen.getByText("Pizza")).toBeInTheDocument();

		await user.click(
			screen.getByRole("button", { name: "Add Margherita to cart" }),
		);
		expect(useCart.getState().lines).toEqual([{ item: menu[0], quantity: 1 }]);
	});

	it("shows an in-cart state once the item is added", async () => {
		vi.mocked(getMenu).mockResolvedValue(menu);
		await renderWithRouter(<MenuDetailsPage itemId="pizza" />);
		const user = userEvent.setup();

		await user.click(
			await screen.findByRole("button", { name: "Add Margherita to cart" }),
		);
		expect(
			await screen.findByRole("button", {
				name: "Margherita is already in the cart",
			}),
		).toBeInTheDocument();
	});

	it("shows a not-available state for an unknown item", async () => {
		vi.mocked(getMenu).mockResolvedValue(menu);
		await renderWithRouter(<MenuDetailsPage itemId="ghost" />);

		expect(await screen.findByText("Dish not available.")).toBeInTheDocument();
	});

	it("shows an error with a retry", async () => {
		vi.mocked(getMenu).mockRejectedValueOnce(new Error("Network down"));
		await renderWithRouter(<MenuDetailsPage itemId="pizza" />);
		const user = userEvent.setup();

		expect(await screen.findByRole("alert")).toHaveTextContent("Network down");
		vi.mocked(getMenu).mockResolvedValueOnce(menu);
		await user.click(screen.getByRole("button", { name: "Try again" }));

		expect(
			await screen.findByRole("heading", { name: "Margherita" }),
		).toBeInTheDocument();
	});
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getMenu } from "@/lib/api";
import { useCart } from "@/stores/cart.store";
import type { MenuItem } from "@/types/api";
import { MenuPage } from "./menu-page";

vi.mock("@/lib/api", () => ({ getMenu: vi.fn() }));

const menu: MenuItem[] = [
	{
		id: "burger",
		name: "Cheeseburger",
		description: "Beef",
		priceCents: 1199,
		image: "",
		category: "Burgers",
	},
	{
		id: "pizza",
		name: "Margherita",
		description: "Tomato",
		priceCents: 1299,
		image: "",
		category: "Pizza",
	},
	{
		id: "pepperoni",
		name: "Pepperoni",
		description: "Spicy",
		priceCents: 1499,
		image: "",
		category: "Pizza",
	},
];

const renderPage = () =>
	render(
		<QueryClientProvider client={new QueryClient()}>
			<MenuPage />
		</QueryClientProvider>,
	);

describe("MenuPage", () => {
	beforeEach(() => {
		useCart.setState({ lines: [] });
		vi.mocked(getMenu).mockReset();
	});

	it("lists every item and filters by category", async () => {
		vi.mocked(getMenu).mockResolvedValue(menu);
		renderPage();
		const user = userEvent.setup();

		expect(await screen.findAllByRole("article")).toHaveLength(3);
		const filters = within(
			screen.getByRole("group", { name: "Filter by category" }),
		);
		expect(
			filters.getAllByRole("button").map((button) => button.textContent),
		).toEqual(["All", "Burgers", "Pizza"]);

		await user.click(filters.getByRole("button", { name: "Pizza" }));

		expect(screen.getAllByRole("article")).toHaveLength(2);
		expect(
			screen.queryByRole("heading", { name: "Cheeseburger" }),
		).not.toBeInTheDocument();
		expect(filters.getByRole("button", { name: "Pizza" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
	});

	it("adds items to the cart and lets the quantity change", async () => {
		vi.mocked(getMenu).mockResolvedValue(menu);
		renderPage();
		const user = userEvent.setup();

		await user.click(
			await screen.findByRole("button", { name: "Add Margherita to cart" }),
		);
		expect(useCart.getState().lines).toEqual([{ item: menu[1], quantity: 1 }]);

		await user.click(
			screen.getByRole("button", { name: "Increase quantity of Margherita" }),
		);
		expect(useCart.getState().lines[0]?.quantity).toBe(2);

		await user.click(
			screen.getByRole("button", { name: "Decrease quantity of Margherita" }),
		);
		await user.click(
			screen.getByRole("button", { name: "Decrease quantity of Margherita" }),
		);
		expect(useCart.getState().lines).toEqual([]);
		expect(
			screen.getByRole("button", { name: "Add Margherita to cart" }),
		).toBeInTheDocument();
	});

	it("shows an error with a retry", async () => {
		vi
			.mocked(getMenu)
			.mockRejectedValueOnce(new Error("Network down"))
			.mockResolvedValueOnce(menu);
		renderPage();
		const user = userEvent.setup();

		expect(await screen.findByRole("alert")).toHaveTextContent("Network down");
		await user.click(screen.getByRole("button", { name: "Try again" }));

		expect(await screen.findAllByRole("article")).toHaveLength(3);
	});
});

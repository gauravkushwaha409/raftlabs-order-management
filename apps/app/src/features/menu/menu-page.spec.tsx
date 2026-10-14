import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCart } from "@/stores/cart.store";
import type { MenuItem } from "@/types/api";
import { MenuPage } from "./menu-page";
import { menuApiService } from "./services/menu-api.service";

vi.mock("./services/menu-api.service", () => ({
	menuApiService: { listMenu: vi.fn() },
}));

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

const renderPage = async () => {
	const rootRoute = createRootRoute({
		component: () => (
			<QueryClientProvider client={new QueryClient()}>
				<MenuPage />
			</QueryClientProvider>
		),
	});
	const router = createRouter({
		routeTree: rootRoute,
		history: createMemoryHistory({ initialEntries: ["/"] }),
	});
	await router.load();
	return render(<RouterProvider router={router} />);
};

const listEnvelope = (items: MenuItem[]) =>
	({ data: { data: items } }) as unknown as Awaited<
		ReturnType<typeof menuApiService.listMenu>
	>;

describe("MenuPage", () => {
	beforeEach(() => {
		useCart.setState({ lines: [] });
		vi.mocked(menuApiService.listMenu).mockReset();
	});

	it("lists every item and filters by category", async () => {
		vi.mocked(menuApiService.listMenu).mockResolvedValue(listEnvelope(menu));
		await renderPage();
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

	it("adds items to the cart from the list", async () => {
		vi.mocked(menuApiService.listMenu).mockResolvedValue(listEnvelope(menu));
		await renderPage();
		const user = userEvent.setup();

		await user.click(
			await screen.findByRole("button", { name: "Add Margherita to cart" }),
		);
		expect(useCart.getState().lines).toEqual([{ item: menu[1], quantity: 1 }]);

		// The card now reports the in-cart state instead of offering Add again,
		// so repeated taps can't bump the quantity from the list.
		expect(
			await screen.findByRole("button", {
				name: "Margherita is already in the cart",
			}),
		).toBeInTheDocument();
		expect(useCart.getState().lines[0]?.quantity).toBe(1);
		expect(
			screen.queryByRole("button", { name: "Add Margherita to cart" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /quantity of/i }),
		).not.toBeInTheDocument();
	});

	it("shows an error with a retry", async () => {
		vi
			.mocked(menuApiService.listMenu)
			.mockRejectedValueOnce(new Error("Network down"))
			.mockResolvedValueOnce(listEnvelope(menu));
		await renderPage();
		const user = userEvent.setup();

		expect(await screen.findByRole("alert")).toHaveTextContent("Network down");
		await user.click(screen.getByRole("button", { name: "Try again" }));

		expect(await screen.findAllByRole("article")).toHaveLength(3);
	});
});

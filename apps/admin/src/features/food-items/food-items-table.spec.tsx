import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MenuItem } from "@/types/api";
import { FoodItemsTable } from "./food-items-table";

const item = (id: string, overrides: Partial<MenuItem> = {}): MenuItem => ({
	id,
	name: "Margherita",
	description: "Classic tomato and mozzarella",
	priceCents: 1299,
	image: "",
	category: "Pizza",
	available: true,
	...overrides,
});

const margherita = item("11111111-0000-4000-8000-000000000000");
const hidden = item("22222222-0000-4000-8000-000000000000", {
	name: "Ghost Burger",
	available: false,
});

describe("FoodItemsTable", () => {
	it("shows an empty state", () => {
		render(<FoodItemsTable items={[]} onEdit={vi.fn()} onDelete={vi.fn()} />);
		expect(screen.getByText("No food items yet.")).toBeInTheDocument();
	});

	it("renders each item with category, price and availability", () => {
		render(
			<FoodItemsTable
				items={[margherita, hidden]}
				onEdit={vi.fn()}
				onDelete={vi.fn()}
			/>,
		);

		const rows = screen.getAllByRole("row");
		expect(
			within(rows[1] as HTMLElement).getByText("Margherita"),
		).toBeInTheDocument();
		expect(within(rows[1] as HTMLElement).getByText("Pizza")).toBeInTheDocument();
		expect(
			within(rows[1] as HTMLElement).getByText("$12.99"),
		).toBeInTheDocument();
		expect(
			within(rows[1] as HTMLElement).getByText("Available"),
		).toBeInTheDocument();
		expect(
			within(rows[2] as HTMLElement).getByText("Unavailable"),
		).toBeInTheDocument();
	});

	it("reports edit and delete actions and disables a busy row", async () => {
		const onEdit = vi.fn();
		const onDelete = vi.fn();
		const { rerender } = render(
			<FoodItemsTable items={[margherita]} onEdit={onEdit} onDelete={onDelete} />,
		);

		await userEvent.click(
			screen.getByRole("button", { name: "Edit food item Margherita" }),
		);
		expect(onEdit).toHaveBeenCalledWith(margherita);

		await userEvent.click(
			screen.getByRole("button", { name: "Delete food item Margherita" }),
		);
		expect(onDelete).toHaveBeenCalledWith(margherita);

		rerender(
			<FoodItemsTable
				items={[margherita]}
				onEdit={onEdit}
				onDelete={onDelete}
				busyItemId={margherita.id}
			/>,
		);
		expect(
			screen.getByRole("button", { name: "Edit food item Margherita" }),
		).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Delete food item Margherita" }),
		).toBeDisabled();
	});
});

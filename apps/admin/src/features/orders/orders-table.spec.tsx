import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Order } from "@/types/api";
import { OrdersTable } from "./orders-table";

const order = (
	id: string,
	status: Order["status"],
	customerName = "Ada Lovelace",
): Order => ({
	id,
	customerName,
	address: "12 Analytical Way",
	phone: "+44 20 7946 0000",
	status,
	totalCents: 2250,
	items: [{ menuItemId: "a", name: "Pizza", priceCents: 1125, quantity: 2 }],
	createdAt: "2026-10-14T10:00:00.000Z",
	updatedAt: "2026-10-14T10:00:00.000Z",
});

const received = order("11111111-0000-4000-8000-000000000000", "RECEIVED");
const delivered = order(
	"22222222-0000-4000-8000-000000000000",
	"DELIVERED",
	"Grace Hopper",
);

describe("OrdersTable", () => {
	it("shows an empty state", () => {
		render(
			<OrdersTable orders={[]} onStatusChange={vi.fn()} onDelete={vi.fn()} />,
		);
		expect(screen.getByText("No orders yet.")).toBeInTheDocument();
	});

	it("renders each order with customer, items, total and status", () => {
		render(
			<OrdersTable
				orders={[received]}
				onStatusChange={vi.fn()}
				onDelete={vi.fn()}
			/>,
		);

		const row = screen.getAllByRole("row")[1] as HTMLElement;
		expect(within(row).getByText("#11111111")).toBeInTheDocument();
		expect(within(row).getByText("Ada Lovelace")).toBeInTheDocument();
		expect(within(row).getByText("2 × Pizza")).toBeInTheDocument();
		expect(within(row).getByText("$22.50")).toBeInTheDocument();
		expect(within(row).getByText("Order Received")).toBeInTheDocument();
	});

	it("offers only the allowed next statuses and reports the choice", async () => {
		const onStatusChange = vi.fn();
		render(
			<OrdersTable
				orders={[received]}
				onStatusChange={onStatusChange}
				onDelete={vi.fn()}
			/>,
		);
		const select = screen.getByRole("combobox", {
			name: "Change status of order 11111111",
		});

		expect(
			within(select)
				.getAllByRole("option")
				.map((option) => option.textContent),
		).toEqual(["Move to…", "Preparing", "Cancelled"]);
		await userEvent.selectOptions(select, "PREPARING");

		expect(onStatusChange).toHaveBeenCalledWith(received, "PREPARING");
	});

	it("hides the status control for final orders", () => {
		render(
			<OrdersTable
				orders={[delivered]}
				onStatusChange={vi.fn()}
				onDelete={vi.fn()}
			/>,
		);
		expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
	});

	it("requests deletion and disables a busy row", async () => {
		const onDelete = vi.fn();
		const { rerender } = render(
			<OrdersTable
				orders={[received]}
				onStatusChange={vi.fn()}
				onDelete={onDelete}
			/>,
		);

		await userEvent.click(
			screen.getByRole("button", { name: "Delete order 11111111" }),
		);
		expect(onDelete).toHaveBeenCalledWith(received);

		rerender(
			<OrdersTable
				orders={[received]}
				onStatusChange={vi.fn()}
				onDelete={onDelete}
				busyOrderId={received.id}
			/>,
		);
		expect(
			screen.getByRole("button", { name: "Delete order 11111111" }),
		).toBeDisabled();
		expect(screen.getByRole("combobox")).toBeDisabled();
	});
});

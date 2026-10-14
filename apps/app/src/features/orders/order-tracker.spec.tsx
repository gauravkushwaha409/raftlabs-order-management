import { render, screen, within } from "@testing-library/react";
import type { Order } from "@/types/api";
import { OrderTracker } from "./order-tracker";

const order: Order = {
	id: "6b0c2d8e-0000-4000-8000-000000000000",
	customerName: "Ada Lovelace",
	address: "12 Analytical Way",
	phone: "+44 20 7946 0000",
	status: "PREPARING",
	totalCents: 2250,
	items: [
		{ menuItemId: "a", name: "Pizza", priceCents: 1000, quantity: 2 },
		{ menuItemId: "b", name: "Soda", priceCents: 250, quantity: 1 },
	],
	createdAt: "2026-10-14T10:00:00.000Z",
	updatedAt: "2026-10-14T10:00:00.000Z",
};

const steps = () =>
	within(screen.getByRole("list", { name: "Order progress" })).getAllByRole(
		"listitem",
	);

describe("OrderTracker", () => {
	it("marks earlier steps done and the current step active", () => {
		render(<OrderTracker order={order} />);

		const [received, preparing, outForDelivery, delivered] = steps();
		expect(received).toHaveTextContent("Order Received (completed)");
		expect(preparing).toHaveAttribute("aria-current", "step");
		expect(preparing).toHaveTextContent("Preparing (current)");
		expect(outForDelivery).not.toHaveAttribute("aria-current");
		expect(delivered).not.toHaveTextContent("completed");
	});

	it("marks every step done once delivered", () => {
		render(<OrderTracker order={{ ...order, status: "DELIVERED" }} />);

		for (const step of steps()) expect(step).toHaveTextContent("(completed)");
		expect(steps().some((step) => step.hasAttribute("aria-current"))).toBe(false);
	});

	it("shows a cancelled message instead of progress", () => {
		render(<OrderTracker order={{ ...order, status: "CANCELLED" }} />);

		expect(screen.getByRole("status")).toHaveTextContent(
			"This order was cancelled.",
		);
		expect(
			screen.queryByRole("list", { name: "Order progress" }),
		).not.toBeInTheDocument();
	});

	it("lists items, total and delivery details", () => {
		render(<OrderTracker order={order} />);

		expect(screen.getByText("2 × Pizza")).toBeInTheDocument();
		expect(screen.getByText("$20.00")).toBeInTheDocument();
		expect(screen.getByText("$22.50")).toBeInTheDocument();
		expect(screen.getByText("12 Analytical Way")).toBeInTheDocument();
	});
});

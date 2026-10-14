import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutForm } from "./checkout-form";

const fill = async (name: string, address: string, phone: string) => {
	const user = userEvent.setup();
	if (name) await user.type(screen.getByLabelText("Full name"), name);
	if (address)
		await user.type(screen.getByLabelText("Delivery address"), address);
	if (phone) await user.type(screen.getByLabelText("Phone number"), phone);
	await user.click(screen.getByRole("button", { name: "Place order" }));
};

describe("CheckoutForm", () => {
	it("blocks submission and explains every invalid field", async () => {
		const onSubmit = vi.fn();
		render(<CheckoutForm onSubmit={onSubmit} />);

		await fill("", "", "");

		expect(await screen.findByText("Enter your full name")).toBeInTheDocument();
		expect(screen.getByText("Enter your delivery address")).toBeInTheDocument();
		expect(screen.getByText("Enter a valid phone number")).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("rejects a malformed phone number", async () => {
		const onSubmit = vi.fn();
		render(<CheckoutForm onSubmit={onSubmit} />);

		await fill("Ada Lovelace", "12 Analytical Way", "call me maybe");

		expect(
			await screen.findByText("Enter a valid phone number"),
		).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("submits trimmed values when everything is valid", async () => {
		const onSubmit = vi.fn();
		render(<CheckoutForm onSubmit={onSubmit} />);

		await fill("  Ada Lovelace ", "12 Analytical Way", "+44 20 7946 0000");

		await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
		expect(onSubmit.mock.calls[0]?.[0]).toEqual({
			customerName: "Ada Lovelace",
			address: "12 Analytical Way",
			phone: "+44 20 7946 0000",
		});
	});

	it("shows a server error", () => {
		render(<CheckoutForm onSubmit={vi.fn()} error="Menu item is unavailable" />);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Menu item is unavailable",
		);
	});

	it("disables the button while the order is being placed", () => {
		render(<CheckoutForm onSubmit={vi.fn()} isPending />);
		expect(screen.getByRole("button", { name: "Placing order…" })).toBeDisabled();
	});
});

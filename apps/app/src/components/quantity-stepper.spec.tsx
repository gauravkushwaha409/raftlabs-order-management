import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MAX_QUANTITY } from "@/stores/cart.store";
import { QuantityStepper } from "./quantity-stepper";

describe("QuantityStepper", () => {
	it("disables decrease at quantity 1 so the line can't be deleted", async () => {
		const onChange = vi.fn();
		render(
			<QuantityStepper label="Margherita" quantity={1} onChange={onChange} />,
		);

		expect(
			screen.getByRole("button", { name: "Decrease quantity of Margherita" }),
		).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Increase quantity of Margherita" }),
		).toBeEnabled();

		await userEvent.click(
			screen.getByRole("button", { name: "Increase quantity of Margherita" }),
		);
		expect(onChange).toHaveBeenCalledWith(2);
	});

	it("enables decrease above 1 and caps increase at the maximum", () => {
		const onChange = vi.fn();
		const { rerender } = render(
			<QuantityStepper label="Margherita" quantity={2} onChange={onChange} />,
		);

		expect(
			screen.getByRole("button", { name: "Decrease quantity of Margherita" }),
		).toBeEnabled();

		rerender(
			<QuantityStepper
				label="Margherita"
				quantity={MAX_QUANTITY}
				onChange={onChange}
			/>,
		);
		expect(
			screen.getByRole("button", { name: "Increase quantity of Margherita" }),
		).toBeDisabled();
	});
});

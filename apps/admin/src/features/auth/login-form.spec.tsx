import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";

describe("LoginForm", () => {
	it("requires a key", async () => {
		const onSubmit = vi.fn();
		render(<LoginForm onSubmit={onSubmit} />);

		await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

		expect(screen.getByText("Enter the admin key")).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("submits the trimmed key", async () => {
		const onSubmit = vi.fn();
		render(<LoginForm onSubmit={onSubmit} />);

		await userEvent.type(screen.getByLabelText("Admin key"), "  my-key ");
		await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

		expect(onSubmit).toHaveBeenCalledWith("my-key");
	});

	it("shows an error from the server", () => {
		render(<LoginForm onSubmit={vi.fn()} error="Invalid or missing admin key" />);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Invalid or missing admin key",
		);
	});
});

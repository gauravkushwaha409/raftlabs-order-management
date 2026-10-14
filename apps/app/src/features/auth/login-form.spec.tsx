import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";

describe("LoginForm", () => {
	it("explains missing fields and does not submit", async () => {
		const onSubmit = vi.fn();
		render(<LoginForm onSubmit={onSubmit} />);

		await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

		expect(await screen.findByText("Enter a valid email")).toBeInTheDocument();
		expect(screen.getByText("Enter your password")).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("submits a normalised email and the password", async () => {
		const onSubmit = vi.fn();
		render(<LoginForm onSubmit={onSubmit} />);

		await userEvent.type(screen.getByLabelText("Email"), "  Ada@Example.com ");
		await userEvent.type(screen.getByLabelText("Password"), "analytical-engine");
		await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

		await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
		expect(onSubmit.mock.calls[0]?.[0]).toEqual({
			email: "ada@example.com",
			password: "analytical-engine",
		});
	});

	it("shows a server error and disables the button while pending", () => {
		const { rerender } = render(
			<LoginForm onSubmit={vi.fn()} error="Invalid email or password" />,
		);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Invalid email or password",
		);

		rerender(<LoginForm onSubmit={vi.fn()} isPending />);
		expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled();
	});
});

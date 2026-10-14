import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";

describe("LoginForm", () => {
	it("requires an email and a password", async () => {
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

		await userEvent.type(screen.getByLabelText("Email"), " Admin@Example.com ");
		await userEvent.type(screen.getByLabelText("Password"), "admin-password-1");
		await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

		await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
		expect(onSubmit.mock.calls[0]?.[0]).toEqual({
			email: "admin@example.com",
			password: "admin-password-1",
		});
	});

	it("shows an error from the server", () => {
		render(<LoginForm onSubmit={vi.fn()} error="Invalid email or password" />);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Invalid email or password",
		);
	});
});

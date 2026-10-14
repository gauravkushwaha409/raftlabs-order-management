import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "./register-form";

const fill = async (name: string, email: string, password: string) => {
	const user = userEvent.setup();
	if (name) await user.type(screen.getByLabelText("Full name"), name);
	if (email) await user.type(screen.getByLabelText("Email"), email);
	if (password) await user.type(screen.getByLabelText("Password"), password);
	await user.click(screen.getByRole("button", { name: "Create account" }));
};

describe("RegisterForm", () => {
	it("flags every invalid field", async () => {
		const onSubmit = vi.fn();
		render(<RegisterForm onSubmit={onSubmit} />);

		await fill("", "", "");

		expect(await screen.findByText("Enter your name")).toBeInTheDocument();
		expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
		expect(screen.getByText("Use at least 8 characters")).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("rejects a short password", async () => {
		const onSubmit = vi.fn();
		render(<RegisterForm onSubmit={onSubmit} />);

		await fill("Ada Lovelace", "ada@example.com", "short");

		expect(
			await screen.findByText("Use at least 8 characters"),
		).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("submits trimmed, normalised values", async () => {
		const onSubmit = vi.fn();
		render(<RegisterForm onSubmit={onSubmit} />);

		await fill(" Ada Lovelace ", "Ada@Example.com", "analytical-engine");

		await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
		expect(onSubmit.mock.calls[0]?.[0]).toEqual({
			name: "Ada Lovelace",
			email: "ada@example.com",
			password: "analytical-engine",
		});
	});

	it("shows a server error such as a duplicate email", () => {
		render(
			<RegisterForm
				onSubmit={vi.fn()}
				error="An account with this email already exists"
			/>,
		);
		expect(screen.getByRole("alert")).toHaveTextContent("already exists");
	});
});

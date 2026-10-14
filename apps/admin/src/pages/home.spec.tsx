import { render, screen } from "@testing-library/react";
import { Home } from "./home";

describe("Home route", () => {
	it("renders the app title", () => {
		render(<Home />);
		expect(
			screen.getByRole("heading", { name: "Raftlabs Admin" }),
		).toBeInTheDocument();
	});
});

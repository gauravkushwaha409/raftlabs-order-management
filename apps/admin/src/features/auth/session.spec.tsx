import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { login, logout } from "@/lib/api";
import type { User } from "@/types/api";
import { useLogin } from "./session";

vi.mock("@/lib/api", () => ({
	login: vi.fn(),
	logout: vi.fn(),
	getMe: vi.fn(),
}));

const user = (role: User["role"]): User => ({
	id: "u1",
	email: "a@example.com",
	name: "A",
	role,
});

const setup = () => {
	const client = new QueryClient();
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	);
	return { client, ...renderHook(() => useLogin(), { wrapper }) };
};

describe("useLogin", () => {
	beforeEach(() => vi.clearAllMocks());

	it("stores an admin in the session cache", async () => {
		vi.mocked(login).mockResolvedValue(user("ADMIN"));
		const { result, client } = setup();

		await act(() =>
			result.current.mutateAsync({ email: "a@example.com", password: "pw" }),
		);

		expect(client.getQueryData(["me"])).toEqual(user("ADMIN"));
		expect(logout).not.toHaveBeenCalled();
	});

	it("turns a customer away and signs them out again", async () => {
		vi.mocked(login).mockResolvedValue(user("CUSTOMER"));
		vi.mocked(logout).mockResolvedValue(undefined);
		const { result, client } = setup();

		act(() => result.current.mutate({ email: "a@example.com", password: "pw" }));

		await waitFor(() =>
			expect(result.current.error?.message).toBe(
				"This account does not have admin access",
			),
		);
		expect(logout).toHaveBeenCalledTimes(1);
		expect(client.getQueryData(["me"])).toBeUndefined();
	});
});

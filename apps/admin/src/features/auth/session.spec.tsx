import type { ApiResponse } from "@package/api-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { User } from "@/types/api";
import { authApiService } from "./services/auth-api.service";
import { useLogin } from "./session";

vi.mock("./services/auth-api.service", () => ({
	authApiService: { login: vi.fn(), logout: vi.fn(), getMe: vi.fn() },
}));

const user = (role: User["role"]): User => ({
	id: "u1",
	email: "a@example.com",
	name: "A",
	role,
});

/** Minimal envelope; the hook only reads `response.data.data`. */
const loginResponse = (user: User) =>
	({ data: { data: user } }) as unknown as ApiResponse<User>;

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
		vi
			.mocked(authApiService.login)
			.mockResolvedValue(loginResponse(user("ADMIN")));
		const { result, client } = setup();

		await act(() =>
			result.current.mutateAsync({ email: "a@example.com", password: "pw" }),
		);

		expect(client.getQueryData(["me"])).toEqual(user("ADMIN"));
		expect(authApiService.logout).not.toHaveBeenCalled();
	});

	it("turns a customer away and signs them out again", async () => {
		vi
			.mocked(authApiService.login)
			.mockResolvedValue(loginResponse(user("CUSTOMER")));
		vi
			.mocked(authApiService.logout)
			.mockResolvedValue({ data: { data: null } } as unknown as ApiResponse<null>);
		const { result, client } = setup();

		act(() => result.current.mutate({ email: "a@example.com", password: "pw" }));

		await waitFor(() =>
			expect(result.current.error?.message).toBe(
				"This account does not have admin access",
			),
		);
		expect(authApiService.logout).toHaveBeenCalledTimes(1);
		expect(client.getQueryData(["me"])).toBeUndefined();
	});
});

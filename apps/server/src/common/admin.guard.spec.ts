import { type ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AdminGuard } from "./admin.guard.js";

const contextWith = (headers: Record<string, string>) =>
	({
		switchToHttp: () => ({ getRequest: () => ({ headers }) }),
	}) as unknown as ExecutionContext;

describe("AdminGuard", () => {
	const guard = new AdminGuard();

	beforeEach(() => {
		process.env.ADMIN_API_KEY = "secret-admin-key";
	});
	afterEach(() => {
		delete process.env.ADMIN_API_KEY;
	});

	it("allows the configured key", () => {
		expect(
			guard.canActivate(contextWith({ "x-admin-key": "secret-admin-key" })),
		).toBe(true);
	});

	it("rejects a wrong key", () => {
		expect(() =>
			guard.canActivate(contextWith({ "x-admin-key": "nope" })),
		).toThrow(UnauthorizedException);
	});

	it("rejects a missing header", () => {
		expect(() => guard.canActivate(contextWith({}))).toThrow(
			UnauthorizedException,
		);
	});

	it("denies everything when no key is configured", () => {
		delete process.env.ADMIN_API_KEY;
		expect(() => guard.canActivate(contextWith({ "x-admin-key": "" }))).toThrow(
			UnauthorizedException,
		);
	});
});

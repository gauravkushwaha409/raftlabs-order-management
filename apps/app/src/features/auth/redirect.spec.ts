import { safeRedirect } from "./redirect";

describe("safeRedirect", () => {
	it("keeps internal paths with query strings", () => {
		expect(safeRedirect("/checkout")).toBe("/checkout");
		expect(safeRedirect("/orders/abc?x=1")).toBe("/orders/abc?x=1");
	});

	it.each([
		"https://evil.test",
		"//evil.test",
		"/\\evil.test",
		"javascript:alert(1)",
		"evil",
	])("rejects %s", (target) => {
		expect(safeRedirect(target)).toBe("/");
	});

	it("falls back when missing", () => {
		expect(safeRedirect(undefined)).toBe("/");
		expect(safeRedirect(undefined, "/orders")).toBe("/orders");
	});
});

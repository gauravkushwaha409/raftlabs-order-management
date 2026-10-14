import { readCookie, sessionCookieOptions } from "./cookies.js";

describe("readCookie", () => {
	it("finds a cookie among several", () => {
		expect(readCookie("a=1; access_token=abc.def; b=2", "access_token")).toBe(
			"abc.def",
		);
	});

	it("returns undefined when absent or the header is missing", () => {
		expect(readCookie("a=1", "access_token")).toBeUndefined();
		expect(readCookie(undefined, "access_token")).toBeUndefined();
	});

	it("does not match on a name suffix", () => {
		expect(readCookie("not_access_token=x", "access_token")).toBeUndefined();
	});

	it("tolerates malformed encoding", () => {
		expect(readCookie("access_token=%E0%A4%A", "access_token")).toBeUndefined();
	});
});

describe("sessionCookieOptions", () => {
	afterEach(() => {
		delete process.env.COOKIE_SAME_SITE;
	});

	it("is httpOnly and lax by default", () => {
		expect(sessionCookieOptions()).toMatchObject({
			httpOnly: true,
			sameSite: "lax",
			secure: false,
		});
	});

	it("forces secure for cross-site cookies", () => {
		process.env.COOKIE_SAME_SITE = "none";
		expect(sessionCookieOptions()).toMatchObject({
			httpOnly: true,
			sameSite: "none",
			secure: true,
		});
	});
});

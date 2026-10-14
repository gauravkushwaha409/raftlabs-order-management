import { hashPassword, verifyPassword } from "./password.js";

describe("password hashing", () => {
	it("verifies the right password and rejects a wrong one", async () => {
		const stored = await hashPassword("correct horse battery staple");
		expect(await verifyPassword("correct horse battery staple", stored)).toBe(
			true,
		);
		expect(await verifyPassword("wrong password", stored)).toBe(false);
	});

	it("salts every hash", async () => {
		expect(await hashPassword("same-password")).not.toBe(
			await hashPassword("same-password"),
		);
	});

	it("never stores the plain password", async () => {
		expect(await hashPassword("my-secret-pw")).not.toContain("my-secret-pw");
	});

	it("rejects malformed stored values", async () => {
		expect(await verifyPassword("anything", "not-a-hash")).toBe(false);
		expect(await verifyPassword("anything", "")).toBe(false);
	});
});

import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { FakePrisma, FakeRedis } from "../../../test/fakes.js";
import type { PrismaService } from "../../prisma/service/prisma.service.js";
import type { RedisService } from "../../redis/service/redis.service.js";
import { verifyPassword } from "../util/password.js";
import { AuthService } from "./auth.service.js";

const SECRET = "unit-test-secret-unit-test-secret-1234";

function setup() {
	const prisma = new FakePrisma();
	const jwt = new JwtService({
		secret: SECRET,
		signOptions: { expiresIn: "7d" },
	});
	const redis = new FakeRedis();
	return {
		prisma,
		jwt,
		redis,
		auth: new AuthService(
			prisma as unknown as PrismaService,
			jwt,
			redis as unknown as RedisService,
		),
	};
}

describe("AuthService", () => {
	describe("register", () => {
		it("creates a customer with a hashed password and returns a token", async () => {
			const { auth, prisma } = setup();
			const { user, token } = await auth.register({
				name: "Ada",
				email: "ada@example.com",
				password: "analytical-engine",
			});

			expect(user).toEqual({
				id: expect.any(String),
				email: "ada@example.com",
				name: "Ada",
				role: "CUSTOMER",
			});
			expect(prisma.users[0]?.passwordHash).not.toContain("analytical-engine");
			expect(
				await verifyPassword(
					"analytical-engine",
					prisma.users[0]?.passwordHash ?? "",
				),
			).toBe(true);
			expect(await auth.authenticate(token)).toEqual(user);
		});

		it("rejects a duplicate email", async () => {
			const { auth } = setup();
			await auth.register({
				name: "Ada",
				email: "ada@example.com",
				password: "analytical-engine",
			});
			await expect(
				auth.register({
					name: "Other",
					email: "ada@example.com",
					password: "another-password",
				}),
			).rejects.toBeInstanceOf(ConflictException);
		});

		it("maps a unique-constraint race to a conflict", async () => {
			const { auth, prisma } = setup();
			prisma.user.create = async () => {
				throw Object.assign(new Error("unique"), { code: "P2002" });
			};
			await expect(
				auth.register({
					name: "Ada",
					email: "ada@example.com",
					password: "analytical-engine",
				}),
			).rejects.toBeInstanceOf(ConflictException);
		});
	});

	describe("login", () => {
		it("accepts the right credentials", async () => {
			const { auth } = setup();
			const registered = await auth.register({
				name: "Ada",
				email: "ada@example.com",
				password: "analytical-engine",
			});
			const { user } = await auth.login({
				email: "ada@example.com",
				password: "analytical-engine",
			});
			expect(user).toEqual(registered.user);
		});

		it("rejects a wrong password and an unknown email with the same error", async () => {
			const { auth } = setup();
			await auth.register({
				name: "Ada",
				email: "ada@example.com",
				password: "analytical-engine",
			});
			const wrongPassword = await auth
				.login({ email: "ada@example.com", password: "nope-nope-nope" })
				.catch((error) => error);
			const unknownEmail = await auth
				.login({ email: "who@example.com", password: "analytical-engine" })
				.catch((error) => error);

			expect(wrongPassword).toBeInstanceOf(UnauthorizedException);
			expect(unknownEmail).toBeInstanceOf(UnauthorizedException);
			expect(unknownEmail.message).toBe(wrongPassword.message);
		});
	});

	describe("authenticate", () => {
		it("returns null for missing, malformed, wrongly signed and expired tokens", async () => {
			const { auth, jwt } = setup();
			const { user } = await auth.register({
				name: "Ada",
				email: "ada@example.com",
				password: "analytical-engine",
			});
			const forged = await new JwtService({
				secret: "another-secret-another-secret-another",
			}).signAsync({ sub: user.id });
			const expired = await jwt.signAsync({ sub: user.id }, { expiresIn: "-1s" });

			expect(await auth.authenticate(undefined)).toBeNull();
			expect(await auth.authenticate("garbage")).toBeNull();
			expect(await auth.authenticate(forged)).toBeNull();
			expect(await auth.authenticate(expired)).toBeNull();
		});

		it("returns null once the user is gone", async () => {
			const { auth, prisma, redis } = setup();
			const { token } = await auth.register({
				name: "Ada",
				email: "ada@example.com",
				password: "analytical-engine",
			});
			redis.clearStore(); // resolve against the DB, not a cached snapshot
			prisma.users = [];
			expect(await auth.authenticate(token)).toBeNull();
		});

		it("serves repeat validations from cache", async () => {
			const { auth, prisma } = setup();
			const { user, token } = await auth.register({
				name: "Ada",
				email: "ada@example.com",
				password: "analytical-engine",
			});

			expect(await auth.authenticate(token)).toEqual(user);

			// The DB row is gone, but the cached snapshot still validates.
			// The TTL bounds this window; the DB stays the authority.
			prisma.users = [];
			expect(await auth.authenticate(token)).toEqual(user);
		});
	});
});

import { FakePrisma } from "../../test/fakes.js";
import { verifyPassword } from "../auth/password.js";
import { MENU_SEED } from "../menu/menu.data.js";
import type { PrismaService } from "../prisma/prisma.service.js";
import { SeedService } from "./seed.service.js";

const ENV_KEYS = [
	"ADMIN_EMAIL",
	"ADMIN_PASSWORD",
	"CUSTOMER_EMAIL",
	"CUSTOMER_PASSWORD",
];

const seed = async (prisma = new FakePrisma()) => {
	await new SeedService(
		prisma as unknown as PrismaService,
	).onApplicationBootstrap();
	return prisma;
};

describe("SeedService", () => {
	beforeEach(() => {
		for (const key of ENV_KEYS) delete process.env[key];
	});
	afterEach(() => {
		for (const key of ENV_KEYS) delete process.env[key];
		vi.unstubAllEnvs();
	});

	it("seeds the menu, an admin and a customer by default", async () => {
		const prisma = await seed();

		expect(prisma.menuItems).toHaveLength(MENU_SEED.length);
		expect(prisma.users.map((user) => [user.email, user.role])).toEqual([
			["admin@example.com", "ADMIN"],
			["customer@example.com", "CUSTOMER"],
		]);
		expect(
			await verifyPassword("Admin@12345", prisma.users[0]?.passwordHash ?? ""),
		).toBe(true);
		expect(
			await verifyPassword("Customer@12345", prisma.users[1]?.passwordHash ?? ""),
		).toBe(true);
	});

	it("uses credentials from env when provided", async () => {
		process.env.ADMIN_EMAIL = "Boss@Example.com";
		process.env.ADMIN_PASSWORD = "boss-password-1";
		process.env.CUSTOMER_EMAIL = "buyer@example.com";
		process.env.CUSTOMER_PASSWORD = "buyer-password-1";

		const prisma = await seed();

		expect(prisma.users.map((user) => user.email)).toEqual([
			"boss@example.com",
			"buyer@example.com",
		]);
		expect(
			await verifyPassword("boss-password-1", prisma.users[0]?.passwordHash ?? ""),
		).toBe(true);
	});

	it("is idempotent and never changes existing rows", async () => {
		const prisma = await seed();
		const hashes = prisma.users.map((user) => user.passwordHash);
		process.env.ADMIN_PASSWORD = "changed-password-2";

		await seed(prisma);

		expect(prisma.users).toHaveLength(2);
		expect(prisma.users.map((user) => user.passwordHash)).toEqual(hashes);
		expect(prisma.menuItems).toHaveLength(MENU_SEED.length);
	});

	it("leaves an existing menu alone", async () => {
		const prisma = new FakePrisma();
		prisma.addMenuItem({ name: "Custom", priceCents: 100 });
		await seed(prisma);
		expect(prisma.menuItems).toHaveLength(1);
	});

	describe("in production", () => {
		beforeEach(() => vi.stubEnv("NODE_ENV", "production"));

		it("never falls back to well-known default passwords", async () => {
			const prisma = await seed();
			expect(prisma.users).toHaveLength(0);
			expect(prisma.menuItems).toHaveLength(MENU_SEED.length); // the menu has no secrets
		});

		it("seeds only the accounts that are configured", async () => {
			process.env.ADMIN_EMAIL = "boss@example.com";
			process.env.ADMIN_PASSWORD = "boss-password-1";

			const prisma = await seed();

			expect(prisma.users.map((user) => [user.email, user.role])).toEqual([
				["boss@example.com", "ADMIN"],
			]);
		});

		it("needs both email and password", async () => {
			process.env.ADMIN_EMAIL = "boss@example.com";
			expect((await seed()).users).toHaveLength(0);
		});
	});
});

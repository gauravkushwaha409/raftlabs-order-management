import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { FakePrisma } from "../../../test/fakes.js";
import type { PrismaService } from "../../prisma/service/prisma.service.js";
import { AuthService } from "../service/auth.service.js";
import { JwtStrategy } from "./jwt.strategy.js";

const SECRET = "unit-test-secret-unit-test-secret-1234";

async function setup() {
	process.env.JWT_SECRET = SECRET;
	const prisma = new FakePrisma();
	const auth = new AuthService(
		prisma as unknown as PrismaService,
		new JwtService({ secret: SECRET }),
	);
	const strategy = new JwtStrategy(auth);
	const user = prisma.addUser({ email: "a@example.com" });
	return { prisma, auth, strategy, user };
}

describe("JwtStrategy", () => {
	it("resolves the live user for a verified subject", async () => {
		const { strategy, user } = await setup();

		await expect(await strategy.validate({ sub: user.id })).toEqual({
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
		});
	});

	it("rejects deleted accounts", async () => {
		const { prisma, strategy, user } = await setup();
		prisma.users = prisma.users.filter((entry) => entry.id !== user.id);

		await expect(strategy.validate({ sub: user.id })).rejects.toBeInstanceOf(
			UnauthorizedException,
		);
	});
});

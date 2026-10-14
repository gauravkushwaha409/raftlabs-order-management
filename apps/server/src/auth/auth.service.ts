import {
	ConflictException,
	Injectable,
	Logger,
	type OnApplicationBootstrap,
	UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service.js";
import type { LoginDto, RegisterDto } from "./auth.dto.js";
import type { AuthUser } from "./auth.types.js";
import { hashPassword, verifyPassword } from "./password.js";

const toAuthUser = ({ id, email, name, role }: AuthUser): AuthUser => ({
	id,
	email,
	name,
	role,
});

// Verified against when the email is unknown so a login attempt costs the same either way.
const DUMMY_HASH = hashPassword("dummy-password-for-timing");

@Injectable()
export class AuthService implements OnApplicationBootstrap {
	private readonly logger = new Logger(AuthService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly jwt: JwtService,
	) {}

	/** Creates the first admin from ADMIN_EMAIL/ADMIN_PASSWORD. Existing accounts are never modified. */
	async onApplicationBootstrap() {
		const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
		const password = process.env.ADMIN_PASSWORD;
		if (!email || !password) return;
		if (await this.prisma.user.findUnique({ where: { email } })) return;
		await this.prisma.user.create({
			data: {
				email,
				name: "Admin",
				passwordHash: await hashPassword(password),
				role: "ADMIN",
			},
		});
		this.logger.log(`Created admin account ${email}`);
	}

	async register(dto: RegisterDto): Promise<{ user: AuthUser; token: string }> {
		if (await this.prisma.user.findUnique({ where: { email: dto.email } })) {
			throw new ConflictException("An account with this email already exists");
		}
		try {
			const user = await this.prisma.user.create({
				data: {
					email: dto.email,
					name: dto.name,
					passwordHash: await hashPassword(dto.password),
				},
			});
			return { user: toAuthUser(user), token: await this.sign(user.id) };
		} catch (error) {
			if ((error as { code?: string }).code === "P2002") {
				throw new ConflictException("An account with this email already exists"); // lost a race with another signup
			}
			throw error;
		}
	}

	async login(dto: LoginDto): Promise<{ user: AuthUser; token: string }> {
		const user = await this.prisma.user.findUnique({
			where: { email: dto.email },
		});
		const valid = await verifyPassword(
			dto.password,
			user?.passwordHash ?? (await DUMMY_HASH),
		);
		if (!user || !valid)
			throw new UnauthorizedException("Invalid email or password");
		return { user: toAuthUser(user), token: await this.sign(user.id) };
	}

	/** Resolves a session token to its user, or null. Reads the DB so deleted or demoted users lose access at once. */
	async authenticate(token: string | undefined): Promise<AuthUser | null> {
		if (!token) return null;
		try {
			const { sub } = await this.jwt.verifyAsync<{ sub: string }>(token);
			const user = await this.prisma.user.findUnique({ where: { id: sub } });
			return user ? toAuthUser(user) : null;
		} catch {
			return null;
		}
	}

	private sign(userId: string) {
		return this.jwt.signAsync({ sub: userId });
	}
}

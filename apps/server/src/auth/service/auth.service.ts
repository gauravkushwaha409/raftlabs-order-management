import {
	ConflictException,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/service/prisma.service.js";
import {
	REDIS_KEYS,
	REDIS_TTL_SECONDS,
} from "../../common/constant/redis-keys.js";
import { RedisService } from "../../redis/service/redis.service.js";
import type { LoginDto, RegisterDto } from "../dto/auth.dto.js";
import type { AuthUser } from "../types/auth.types.js";
import { hashPassword, verifyPassword } from "../util/password.js";

const toAuthUser = ({ id, email, name, role }: AuthUser): AuthUser => ({
	id,
	email,
	name,
	role,
});

// Verified against when the email is unknown so a login attempt costs the same either way.
const DUMMY_HASH = hashPassword("dummy-password-for-timing");

@Injectable()
export class AuthService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly jwt: JwtService,
		private readonly redis: RedisService,
	) {}

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
			return await this.resolveUser(sub);
		} catch {
			return null;
		}
	}

	/** Live user for a verified `sub` claim, or null. Cache-aside: the DB stays the authority, the entry expires quickly. */
	async resolveUser(sub: string): Promise<AuthUser | null> {
		const key = REDIS_KEYS.SESSION_USER(sub);
		try {
			const cached = await this.redis.getJson<AuthUser>(key);
			if (cached) return cached;
		} catch {
			// Cache failure must never fail authentication; fall through to the DB.
		}
		const user = await this.prisma.user.findUnique({ where: { id: sub } });
		const authUser = user ? toAuthUser(user) : null;
		if (authUser) {
			try {
				await this.redis.setJson(key, authUser, REDIS_TTL_SECONDS.SESSION_USER);
			} catch {
				// Best-effort: the next read simply hits the DB again.
			}
		}
		return authUser;
	}

	private sign(userId: string) {
		return this.jwt.signAsync({ sub: userId });
	}
}

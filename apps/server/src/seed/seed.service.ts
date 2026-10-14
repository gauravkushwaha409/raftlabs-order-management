import {
	Injectable,
	Logger,
	type OnApplicationBootstrap,
} from "@nestjs/common";
import { hashPassword } from "../auth/password.js";
import type { Role } from "../generated/prisma/enums.js";
import { MENU_SEED } from "../menu/menu.data.js";
import { PrismaService } from "../prisma/prisma.service.js";

interface SeedAccount {
	email: string;
	name: string;
	password: string;
	role: Role;
}

/** Documented dev/demo credentials, used only outside production when nothing is configured. */
const DEV_DEFAULTS = {
	ADMIN: { email: "admin@example.com", password: "Admin@12345", name: "Admin" },
	CUSTOMER: {
		email: "customer@example.com",
		password: "Customer@12345",
		name: "Demo Customer",
	},
} as const;

const ENV_KEYS = {
	ADMIN: { email: "ADMIN_EMAIL", password: "ADMIN_PASSWORD" },
	CUSTOMER: { email: "CUSTOMER_EMAIL", password: "CUSTOMER_PASSWORD" },
} as const;

/**
 * Fills an empty database with demo data on startup: the menu, one admin and one customer, so the app
 * is usable without signing anyone up. Existing rows are never touched, so reruns are harmless.
 * Account credentials come from env; without env they fall back to DEV_DEFAULTS everywhere except
 * production, where well-known default passwords would be a hole, so those accounts are skipped.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
	private readonly logger = new Logger(SeedService.name);

	constructor(private readonly prisma: PrismaService) {}

	async onApplicationBootstrap() {
		await this.seedMenu();
		for (const role of ["ADMIN", "CUSTOMER"] as const)
			await this.seedAccount(this.resolveAccount(role));
	}

	private async seedMenu() {
		if ((await this.prisma.menuItem.count()) > 0) return;
		await this.prisma.menuItem.createMany({
			data: MENU_SEED.map((item) => ({ ...item })),
		});
		this.logger.log(`Seeded ${MENU_SEED.length} menu items`);
	}

	private resolveAccount(role: "ADMIN" | "CUSTOMER"): SeedAccount | null {
		const keys = ENV_KEYS[role];
		const fallback =
			process.env.NODE_ENV === "production" ? undefined : DEV_DEFAULTS[role];
		const email =
			process.env[keys.email]?.trim().toLowerCase() || fallback?.email;
		const password = process.env[keys.password] || fallback?.password;
		if (!email || !password) {
			this.logger.warn(
				`Skipping ${role.toLowerCase()} seed: set ${keys.email} and ${keys.password} to create it`,
			);
			return null;
		}
		return {
			email: email.toLowerCase(),
			password,
			role,
			name: DEV_DEFAULTS[role].name,
		};
	}

	private async seedAccount(account: SeedAccount | null) {
		if (!account) return;
		if (await this.prisma.user.findUnique({ where: { email: account.email } }))
			return;
		await this.prisma.user.create({
			data: {
				email: account.email,
				name: account.name,
				role: account.role,
				passwordHash: await hashPassword(account.password),
			},
		});
		this.logger.log(
			`Seeded ${account.role.toLowerCase()} account ${account.email}`,
		);
	}
}

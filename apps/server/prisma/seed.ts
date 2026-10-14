import * as path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
import { hashPassword } from "../src/auth/password.js";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { DEMO_ACCOUNTS, DEMO_ORDERS, MENU_SEED } from "./seed-data.js";

// SEED_MODE is the single knob: it selects WHICH database (env/.env.<mode>) and WHAT gets seeded. APP_ENV is
// still honored as a fallback for the env file so `APP_ENV=staging pnpm prisma:seed` keeps working.
//   development → menu + demo admin + demo customer + a few past orders
//   staging     → menu + demo admin + demo customer (no demo orders)
//   production  → refuses unless ALLOW_PRODUCTION_SEED=true; then seeds the menu plus only the accounts whose
//                 ADMIN_* / CUSTOMER_* credentials are set in env (never the well-known demo passwords)
type SeedMode = "development" | "staging" | "production";
type Role = "ADMIN" | "CUSTOMER";

function parseSeedMode(raw: string | undefined): SeedMode {
	const value = (raw ?? "development").toLowerCase();
	if (value === "staging" || value === "stg") return "staging";
	if (value === "production" || value === "prod") return "production";
	return "development";
}

const mode = parseSeedMode(process.env.SEED_MODE ?? process.env.APP_ENV);

// Must run BEFORE `new PrismaClient`: the adapter reads DATABASE_URL at construction. Resolved from cwd (scripts run
// with cwd = apps/server). Values already in the environment (docker env_file) are never overridden.
dotenv.config({
	path: path.resolve(process.cwd(), `../../env/.env.${mode}`),
	quiet: true,
});

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

interface Account {
	role: Role;
	email: string;
	name: string;
	password: string;
}

/** Env wins; outside production the documented demo credentials fill any gap. Returns null when production has none. */
function resolveAccount(role: Role): Account | null {
	const key = role === "ADMIN" ? "ADMIN" : "CUSTOMER";
	const demo = DEMO_ACCOUNTS[role === "ADMIN" ? "admin" : "customer"];
	const useDemo = mode !== "production";
	const email = (
		process.env[`${key}_EMAIL`]?.trim() || (useDemo ? demo.email : "")
	).toLowerCase();
	const password =
		process.env[`${key}_PASSWORD`] || (useDemo ? demo.password : "");
	if (!email || !password) return null;
	return { role, email, password, name: demo.name };
}

async function seedMenu() {
	let created = 0;
	for (const item of MENU_SEED) {
		if (await prisma.menuItem.findFirst({ where: { name: item.name } })) continue; // never overwrite menu edits
		await prisma.menuItem.create({ data: { ...item } });
		created++;
	}
	return created;
}

/** Existing accounts are left alone (no password reset), so reruns are harmless. */
async function seedAccount(account: Account) {
	return prisma.user.upsert({
		where: { email: account.email },
		update: {},
		create: {
			email: account.email,
			name: account.name,
			role: account.role,
			passwordHash: await hashPassword(account.password),
		},
	});
}

async function seedDemoOrders(userId: string) {
	if ((await prisma.order.count({ where: { userId } })) > 0) return 0; // only once, so reruns do not pile up orders

	for (const demo of DEMO_ORDERS) {
		const lines = await Promise.all(
			demo.lines.map(async ({ menuItem: name, quantity }) => {
				const menuItem = await prisma.menuItem.findFirstOrThrow({
					where: { name },
				});
				return {
					menuItemId: menuItem.id,
					name: menuItem.name,
					priceCents: menuItem.priceCents,
					quantity,
				};
			}),
		);
		const createdAt = new Date(Date.now() - demo.hoursAgo * 60 * 60 * 1000);
		await prisma.order.create({
			data: {
				userId,
				status: demo.status,
				customerName: demo.customerName,
				address: demo.address,
				phone: demo.phone,
				totalCents: lines.reduce(
					(sum, line) => sum + line.priceCents * line.quantity,
					0,
				),
				createdAt,
				updatedAt: createdAt,
				items: { create: lines },
			},
		});
	}
	return DEMO_ORDERS.length;
}

async function main() {
	if (mode === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") {
		console.error(
			"Refusing to seed production. Re-run with ALLOW_PRODUCTION_SEED=true if you really mean it " +
				"(seeds the menu and only the accounts configured via ADMIN_*/CUSTOMER_* env, never demo passwords).",
		);
		process.exitCode = 1;
		return;
	}

	const menuCreated = await seedMenu();
	const seeded: Account[] = [];
	let customerId: string | undefined;
	for (const role of ["ADMIN", "CUSTOMER"] as const) {
		const account = resolveAccount(role);
		if (!account) {
			console.warn(
				`Skipped ${role.toLowerCase()}: set ${role}_EMAIL and ${role}_PASSWORD to create it.`,
			);
			continue;
		}
		const user = await seedAccount(account);
		if (role === "CUSTOMER") customerId = user.id;
		seeded.push(account);
	}

	const ordersCreated =
		mode === "development" && customerId ? await seedDemoOrders(customerId) : 0;

	console.log(`Seeded (${mode} mode):`);
	console.log(
		`  menu:     ${menuCreated} new item(s), ${MENU_SEED.length} total expected`,
	);
	console.log(`  orders:   ${ordersCreated} demo order(s) created`);
	for (const account of seeded) {
		console.log(
			`  ${account.role.toLowerCase().padEnd(10)}${account.email} / ${mode === "production" ? "(password from env)" : account.password}`,
		);
	}
	if (mode !== "production") {
		console.log(
			`  app:      http://localhost:${process.env.APP_PORT ?? "3000"}  admin: http://localhost:${process.env.ADMIN_PORT ?? "3001"}`,
		);
	}
}

main()
	.catch((error) => {
		console.error("Seed failed:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

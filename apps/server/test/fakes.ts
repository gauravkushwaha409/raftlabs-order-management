import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import type {
	MenuItem,
	Order,
	OrderItem,
	User,
} from "../src/generated/prisma/client.js";
import type { OrderStatus } from "../src/orders/order-status.js";

type OrderRecord = Order & { items: OrderItem[] };
type Where = {
	userId?: string;
	id?: string | { in: string[] };
	status?: OrderStatus | { notIn: OrderStatus[] };
	available?: boolean;
};

const matches = (
	record: { id: string; status?: OrderStatus; available?: boolean },
	where: Where = {},
) => {
	if (typeof where.id === "string" && record.id !== where.id) return false;
	if (typeof where.id === "object" && !where.id.in.includes(record.id))
		return false;
	if (typeof where.status === "string" && record.status !== where.status)
		return false;
	if (
		typeof where.status === "object" &&
		record.status &&
		where.status.notIn.includes(record.status)
	)
		return false;
	if (
		where.userId !== undefined &&
		(record as { userId?: string }).userId !== where.userId
	)
		return false;
	if (where.available !== undefined && record.available !== where.available)
		return false;
	return true;
};

const pick = <T extends object>(record: T, select?: Record<string, boolean>) =>
	select
		? Object.fromEntries(
				Object.keys(select).map((key) => [key, record[key as keyof T]]),
			)
		: record;

/** In-memory stand-in for the slice of PrismaService the app uses. Mirrors Prisma's semantics, not its API surface. */
export class FakePrisma {
	menuItems: MenuItem[] = [];
	orders: OrderRecord[] = [];
	users: User[] = [];

	user = {
		findUnique: async ({ where }: { where: { id?: string; email?: string } }) =>
			this.users.find((user) =>
				where.id ? user.id === where.id : user.email === where.email,
			) ?? null,
		create: async ({
			data,
		}: {
			data: Pick<User, "email" | "name" | "passwordHash"> & Partial<User>;
		}) => {
			const user: User = {
				id: randomUUID(),
				role: "CUSTOMER",
				createdAt: new Date(),
				...data,
			};
			this.users.push(user);
			return user;
		},
	};

	menuItem = {
		count: async () => this.menuItems.length,
		createMany: async ({
			data,
		}: {
			data: Array<
				Omit<MenuItem, "id" | "createdAt" | "available"> & Partial<MenuItem>
			>;
		}) => {
			for (const item of data) this.addMenuItem(item);
			return { count: data.length };
		},
		findMany: async ({
			where,
			select,
		}: {
			where?: Where;
			select?: Record<string, boolean>;
		} = {}) =>
			this.menuItems
				.filter((item) => matches(item, where))
				.map((item) => pick(item, select)),
	};

	order = {
		create: async ({
			data,
		}: {
			data: Record<string, unknown> & {
				items: { create: Array<Omit<OrderItem, "id" | "orderId">> };
			};
		}) => {
			const { items, ...fields } = data;
			const id = randomUUID();
			const now = new Date();
			const order = {
				id,
				status: "RECEIVED",
				createdAt: now,
				updatedAt: now,
				...fields,
				items: items.create.map((item) => ({
					id: randomUUID(),
					orderId: id,
					...item,
				})),
			} as OrderRecord;
			this.orders.push(order);
			return order;
		},
		findMany: async ({
			where,
			take,
			select,
		}: {
			where?: Where;
			take?: number;
			select?: Record<string, boolean>;
		} = {}) =>
			this.orders
				.filter((order) => matches(order, where))
				.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
				.slice(0, take)
				.map((order) => pick(order, select)),
		findUnique: async ({ where }: { where: { id: string } }) =>
			this.orders.find((order) => order.id === where.id) ?? null,
		updateMany: async ({
			where,
			data,
		}: {
			where: Where;
			data: { status: OrderStatus };
		}) => {
			const targets = this.orders.filter((order) => matches(order, where));
			for (const order of targets)
				Object.assign(order, data, { updatedAt: new Date() });
			return { count: targets.length };
		},
		delete: async ({ where }: { where: { id: string } }) => {
			this.orders = this.orders.filter((order) => order.id !== where.id);
		},
	};

	addUser(user: Partial<User> & Pick<User, "email">): User {
		const created: User = {
			id: randomUUID(),
			name: "Test User",
			passwordHash: "unused",
			role: "CUSTOMER",
			createdAt: new Date(),
			...user,
		};
		this.users.push(created);
		return created;
	}

	addMenuItem(
		item: Partial<MenuItem> & Pick<MenuItem, "name" | "priceCents">,
	): MenuItem {
		const menuItem: MenuItem = {
			id: randomUUID(),
			description: "desc",
			image: "https://example.com/x.jpg",
			category: "Pizza",
			available: true,
			createdAt: new Date(),
			...item,
		};
		this.menuItems.push(menuItem);
		return menuItem;
	}
}

class FakeSubscriber extends EventEmitter {
	async subscribe() {}
	async quit() {}
}

/** In-memory pub/sub with the same duplicate/subscribe/publish shape as ioredis. */
export class FakeRedis {
	private readonly subscribers = new Set<FakeSubscriber>();

	duplicate() {
		const subscriber = new FakeSubscriber();
		this.subscribers.add(subscriber);
		return subscriber;
	}

	async publish(channel: string, message: string) {
		for (const subscriber of this.subscribers)
			subscriber.emit("message", channel, message);
		return this.subscribers.size;
	}
}

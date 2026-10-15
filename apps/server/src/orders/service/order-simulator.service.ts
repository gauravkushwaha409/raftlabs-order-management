import {
	Injectable,
	type OnApplicationBootstrap,
	type OnModuleDestroy,
} from "@nestjs/common";
import { Subscription } from "rxjs";
import { isFinalStatus, type OrderStatus } from "../../common/constant/order-status.js";
import { OrderEventsService } from "./order-events.service.js";
import { OrdersService } from "./orders.service.js";

const DEFAULT_STEP_MS = 10_000;

/** Opt-in: only "true" enables automatic status advancement. */
export function isSimulatorEnabled(): boolean {
	return process.env.ORDER_SIMULATOR_ENABLED === "true";
}

/**
 * Simulates the kitchen and courier: walks every order RECEIVED -> PREPARING -> OUT_FOR_DELIVERY
 * -> DELIVERED, one step per ORDER_STEP_MS. Each step is a compare-and-set, so running several
 * instances (or an admin overriding the status) never double-advances an order.
 *
 * Opt-in via ORDER_SIMULATOR_ENABLED=true. When disabled (the default), order
 * statuses only change through explicit admin/user actions.
 */
@Injectable()
export class OrderSimulatorService
	implements OnApplicationBootstrap, OnModuleDestroy
{
	private readonly timers = new Map<string, NodeJS.Timeout>();
	private subscription?: Subscription;

	constructor(
		private readonly orders: OrdersService,
		private readonly events: OrderEventsService,
	) {}

	async onApplicationBootstrap() {
		if (!isSimulatorEnabled()) return;
		this.subscription = this.events.stream$.subscribe((event) => {
			if (event.type === "created")
				this.schedule(event.order.id, event.order.status);
			if (event.type === "deleted") this.clear(event.order.id);
		});
		for (const { id, status } of await this.orders.listActive())
			this.schedule(id, status);
	}

	onModuleDestroy() {
		this.subscription?.unsubscribe();
		for (const id of [...this.timers.keys()]) this.clear(id);
	}

	private get stepMs() {
		const configured = Number(process.env.ORDER_STEP_MS);
		return Number.isFinite(configured) && configured > 0
			? configured
			: DEFAULT_STEP_MS;
	}

	private schedule(id: string, status: OrderStatus) {
		this.clear(id);
		if (isFinalStatus(status)) return;
		const timer = setTimeout(() => void this.step(id, status), this.stepMs);
		timer.unref();
		this.timers.set(id, timer);
	}

	private clear(id: string) {
		clearTimeout(this.timers.get(id));
		this.timers.delete(id);
	}

	private async step(id: string, status: OrderStatus) {
		this.timers.delete(id);
		try {
			const result = await this.orders.advance(id, status);
			if (result) this.schedule(id, result.order.status);
		} catch {
			this.schedule(id, status); // transient failure (DB down): try the same step again
		}
	}
}

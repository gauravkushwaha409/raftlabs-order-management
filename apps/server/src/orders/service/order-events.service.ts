import {
	Injectable,
	Logger,
	type OnModuleDestroy,
	type OnModuleInit,
} from "@nestjs/common";
import type { Redis } from "ioredis";
import { type Observable, Subject } from "rxjs";
import { REDIS_CHANNELS } from "../../redis/constant/redis-keys.js";
import { RedisService } from "../../redis/service/redis.service.js";
import type { OrderView } from "../dto/order.view.js";

export interface OrderEvent {
	type: "created" | "updated" | "deleted";
	order: OrderView;
}

/**
 * Fans order changes out through Redis pub/sub so every server instance (SSE streams,
 * admin websocket, simulator) sees them regardless of which instance handled the request.
 */
@Injectable()
export class OrderEventsService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(OrderEventsService.name);
	private readonly subject = new Subject<OrderEvent>();
	private subscriber?: Redis;

	readonly stream$: Observable<OrderEvent> = this.subject.asObservable();

	constructor(private readonly redis: RedisService) {}

	async onModuleInit() {
		this.subscriber = this.redis.duplicate();
		this.subscriber.on("message", (_channel, message) => {
			try {
				this.subject.next(JSON.parse(message) as OrderEvent);
			} catch (error) {
				this.logger.warn(`Dropped malformed order event: ${String(error)}`);
			}
		});
		await this.subscriber.subscribe(REDIS_CHANNELS.ORDER_EVENTS);
	}

	async onModuleDestroy() {
		this.subject.complete();
		await this.subscriber?.quit();
	}

	/** Never throws: the DB write already succeeded, a lost notification must not fail the request. */
	async publish(event: OrderEvent) {
		try {
			await this.redis.publish(REDIS_CHANNELS.ORDER_EVENTS, JSON.stringify(event));
		} catch (error) {
			this.logger.error(`Failed to publish order event: ${String(error)}`);
		}
	}
}

import { Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import type { Redis } from "ioredis";
import { type Observable, Subject } from "rxjs";
import type { RedisService } from "./service/redis.service.js";

/**
 * Typed fan-out over one Redis pub/sub channel, so every server instance sees events
 * regardless of which instance (or worker process) produced them.
 */
export abstract class RedisChannel<T> implements OnModuleInit, OnModuleDestroy {
	protected abstract readonly channel: string;
	private readonly logger = new Logger(this.constructor.name);
	private readonly subject = new Subject<T>();
	private subscriber?: Redis;

	readonly stream$: Observable<T> = this.subject.asObservable();

	constructor(private readonly redis: RedisService) {}

	async onModuleInit() {
		this.subscriber = this.redis.duplicate();
		this.subscriber.on("message", (_channel, message) => {
			try {
				this.subject.next(JSON.parse(message) as T);
			} catch (error) {
				this.logger.warn(`Dropped malformed message: ${String(error)}`);
			}
		});
		await this.subscriber.subscribe(this.channel);
	}

	async onModuleDestroy() {
		this.subject.complete();
		await this.subscriber?.quit();
	}

	/** Never throws: the DB write already succeeded, a lost live update must not fail the caller. */
	async publish(event: T) {
		try {
			await this.redis.publish(this.channel, JSON.stringify(event));
		} catch (error) {
			this.logger.error(`Failed to publish to ${this.channel}: ${String(error)}`);
		}
	}
}

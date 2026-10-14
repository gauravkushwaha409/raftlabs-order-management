import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Redis } from "ioredis";

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
	constructor() {
		super({
			host: process.env.REDIS_HOST ?? "localhost",
			port: Number(process.env.REDIS_PORT ?? 6379),
		});
	}

	async onModuleDestroy() {
		await this.quit();
	}

	/** JSON cache read. Returns null on a miss, corrupt entry, or Redis failure — callers fall through to the DB. */
	async getJson<T>(key: string): Promise<T | null> {
		const raw = await this.get(key);
		if (raw == null) return null;
		try {
			return JSON.parse(raw) as T;
		} catch {
			return null;
		}
	}

	/** JSON cache write with a TTL. Callers decide whether a failure should be silent. */
	async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
		await this.set(key, JSON.stringify(value), "EX", ttlSeconds);
	}
}

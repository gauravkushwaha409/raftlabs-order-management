import { setTimeout as sleep } from "node:timers/promises";
import {
	Injectable,
	Logger,
	type OnApplicationBootstrap,
	type OnModuleDestroy,
} from "@nestjs/common";
import { ORDER_EVENTS_TOPIC } from "../events/order-events.js";
import { KafkaProducerService } from "../kafka/kafka-producer.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

const BATCH_SIZE = 100;
const IDLE_MS = 500;
const ERROR_BACKOFF_MS = 5_000;
const TRANSACTION_TIMEOUT_MS = 15_000;
/** Arbitrary constant identifying the relay's Postgres advisory lock. */
const RELAY_LOCK_ID = 727_001;

/**
 * Moves outbox rows to Kafka in insertion order, then deletes them.
 *
 * Any number of workers may run this; a transaction-scoped advisory lock lets exactly one relay per
 * cycle, which keeps each order's events in order while the others stand by as hot spares. Delivery
 * is at-least-once: a crash between the Kafka send and the commit re-sends the batch, which is why
 * consumers dedupe on the event id.
 */
@Injectable()
export class OutboxRelayService
	implements OnApplicationBootstrap, OnModuleDestroy
{
	private readonly logger = new Logger(OutboxRelayService.name);
	private readonly stop = new AbortController();
	private loop?: Promise<void>;

	constructor(
		private readonly prisma: PrismaService,
		private readonly producer: KafkaProducerService,
	) {}

	onApplicationBootstrap() {
		this.loop = this.run();
	}

	async onModuleDestroy() {
		this.stop.abort();
		await this.loop;
	}

	/** Relays one batch and returns how many events were published (0 when idle or another relay holds the lock). */
	async relayBatch(): Promise<number> {
		return this.prisma.$transaction(
			async (tx) => {
				const [lock] = await tx.$queryRaw<
					Array<{ locked: boolean }>
				>`SELECT pg_try_advisory_xact_lock(${RELAY_LOCK_ID}) AS locked`;
				if (!lock?.locked) return 0;

				const events = await tx.outboxEvent.findMany({
					orderBy: { seq: "asc" },
					take: BATCH_SIZE,
				});
				if (events.length === 0) return 0;

				await this.producer.send(
					events.map((event) => ({
						topic: ORDER_EVENTS_TOPIC,
						key: event.aggregateId,
						value: JSON.stringify(event.payload),
						headers: { "event-type": event.type, "event-id": event.id },
					})),
				);
				await tx.outboxEvent.deleteMany({
					where: { id: { in: events.map((event) => event.id) } },
				});
				return events.length;
			},
			{ timeout: TRANSACTION_TIMEOUT_MS },
		);
	}

	private async run() {
		while (!this.stop.signal.aborted) {
			let delay = IDLE_MS;
			try {
				if ((await this.relayBatch()) === BATCH_SIZE) continue; // backlog: go again right away
			} catch (error) {
				this.logger.error(`Relay failed, retrying: ${String(error)}`);
				delay = ERROR_BACKOFF_MS;
			}
			await sleep(delay, undefined, { signal: this.stop.signal }).catch(
				() => undefined, // aborted by shutdown
			);
		}
	}
}

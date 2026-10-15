import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import {
	Consumer,
	type MessagesStream,
	MessagesStreamFallbackModes,
	MessagesStreamModes,
	stringDeserializers,
} from "@platformatic/kafka";
import { getKafkaConfig } from "./kafka.config.js";
import type { ConsumedMessage, MessageHandler } from "./kafka.types.js";
import { KafkaProducerService } from "./kafka-producer.service.js";
import { processMessage } from "./message-processor.js";
import { deadLetterTopic } from "./topics.js";

export interface Subscription {
	/** Instances sharing a group id split the topic's partitions between them. */
	groupId: string;
	topics: string[];
	handler: MessageHandler;
}

type Stream = MessagesStream<string, string, string, string>;

/**
 * Starts consumer-group subscriptions. Messages are handled one at a time and their offset is
 * committed only after the handler (or the dead-letter write) finished: at-least-once delivery,
 * so handlers must be idempotent.
 */
@Injectable()
export class KafkaConsumerService implements OnModuleDestroy {
	private readonly logger = new Logger(KafkaConsumerService.name);
	private readonly running: Array<{
		consumer: Consumer<string, string, string, string>;
		stream: Stream;
		done: Promise<void>;
	}> = [];

	constructor(private readonly producer: KafkaProducerService) {}

	async subscribe({ groupId, topics, handler }: Subscription): Promise<void> {
		const { clientId, bootstrapBrokers } = getKafkaConfig();
		const consumer = new Consumer({
			clientId: `${clientId}-${groupId}`,
			bootstrapBrokers,
			groupId,
			deserializers: stringDeserializers,
		});
		const stream = await consumer.consume({
			topics,
			autocommit: false,
			mode: MessagesStreamModes.COMMITTED,
			// A new group starts from the beginning of the topic, so nothing produced before it existed is missed.
			fallbackMode: MessagesStreamFallbackModes.EARLIEST,
		});
		const done = this.pump(groupId, stream, handler);
		this.running.push({ consumer, stream, done });
		this.logger.log(`Group "${groupId}" consuming ${topics.join(", ")}`);
	}

	private async pump(groupId: string, stream: Stream, handler: MessageHandler) {
		try {
			for await (const raw of stream) {
				const message: ConsumedMessage = {
					topic: raw.topic,
					partition: raw.partition,
					offset: raw.offset,
					key: raw.key ?? null,
					value: raw.value ?? "",
					headers: Object.fromEntries(raw.headers ?? []),
				};
				await processMessage(message, handler, (failed, error, attempts) =>
					this.deadLetter(groupId, failed, error, attempts),
				);
				await raw.commit();
			}
		} catch (error) {
			if (!stream.isActive()) return; // closed by shutdown
			this.logger.fatal(
				`Group "${groupId}" stopped: ${String(error)}. Exiting so the orchestrator restarts the worker.`,
			);
			process.exitCode = 1;
			process.kill(process.pid, "SIGTERM"); // graceful, via Nest shutdown hooks
		}
	}

	private async deadLetter(
		groupId: string,
		message: ConsumedMessage,
		error: unknown,
		attempts: number,
	) {
		this.logger.error(
			`Dead-lettering ${message.topic}[${message.partition}]@${message.offset} after ${attempts} attempt(s): ${String(error)}`,
		);
		await this.producer.send([
			{
				topic: deadLetterTopic(message.topic),
				key: message.key ?? "",
				value: message.value,
				headers: {
					...message.headers,
					"x-error": String(error).slice(0, 500),
					"x-group": groupId,
					"x-source-partition": String(message.partition),
					"x-source-offset": String(message.offset),
					"x-attempts": String(attempts),
				},
			},
		]);
	}

	async onModuleDestroy() {
		for (const { consumer, stream, done } of this.running) {
			await stream.close();
			await done;
			await consumer.close();
		}
	}
}

import type {
	ConsumedMessage,
	MessageHandler,
	ProducedMessage,
} from "../src/kafka/kafka.types.js";
import type { KafkaConsumerService } from "../src/kafka/kafka-consumer.service.js";
import type { KafkaProducerService } from "../src/kafka/kafka-producer.service.js";
import { processMessage } from "../src/kafka/message-processor.js";
import { deadLetterTopic } from "../src/kafka/topics.js";

/**
 * In-memory broker: `send` delivers to every subscribed group before resolving, through the real
 * retry/dead-letter policy, so specs can assert on the outcome without waiting for polling.
 */
export class FakeKafka {
	readonly messages: ProducedMessage[] = [];
	private readonly subscriptions: Array<{
		topics: string[];
		handler: MessageHandler;
	}> = [];
	private offset = 0n;

	/** Set to make the next sends fail, like an unreachable broker. */
	failSends = false;

	readonly producer = {
		send: async (messages: ProducedMessage[]) => {
			if (this.failSends) throw new Error("broker unavailable");
			for (const message of messages) {
				this.messages.push(message);
				await this.deliver(message);
			}
		},
	} as unknown as KafkaProducerService;

	readonly consumer = {
		subscribe: async ({
			topics,
			handler,
		}: {
			groupId: string;
			topics: string[];
			handler: MessageHandler;
		}) => {
			this.subscriptions.push({ topics, handler });
		},
	} as unknown as KafkaConsumerService;

	topic(name: string) {
		return this.messages.filter((message) => message.topic === name);
	}

	private async deliver(message: ProducedMessage) {
		const consumed: ConsumedMessage = {
			topic: message.topic,
			partition: 0,
			offset: this.offset++,
			key: message.key,
			value: message.value,
			headers: message.headers ?? {},
		};
		for (const { topics, handler } of this.subscriptions) {
			if (!topics.includes(message.topic)) continue;
			await processMessage(
				consumed,
				handler,
				async (failed, error, attempts) => {
					this.messages.push({
						topic: deadLetterTopic(failed.topic),
						key: failed.key ?? "",
						value: failed.value,
						headers: { "x-error": String(error), "x-attempts": String(attempts) },
					});
				},
				{ maxAttempts: 2, backoffMs: 0 },
			);
		}
	}
}

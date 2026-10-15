import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { ProduceAcks, Producer, stringSerializers } from "@platformatic/kafka";
import { getKafkaConfig } from "./kafka.config.js";
import type { ProducedMessage } from "./kafka.types.js";

/** Idempotent, acks=all producer: a retried send never duplicates or loses a message within a session. */
@Injectable()
export class KafkaProducerService implements OnModuleDestroy {
	private readonly producer: Producer<string, string, string, string>;

	constructor() {
		const { clientId, bootstrapBrokers } = getKafkaConfig();
		this.producer = new Producer({
			clientId: `${clientId}-producer`,
			bootstrapBrokers,
			serializers: stringSerializers,
			idempotent: true,
			acks: ProduceAcks.ALL,
		});
	}

	async send(messages: ProducedMessage[]): Promise<void> {
		if (messages.length === 0) return;
		await this.producer.send({ messages });
	}

	async onModuleDestroy() {
		await this.producer.close();
	}
}

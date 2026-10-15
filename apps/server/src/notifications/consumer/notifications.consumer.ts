import {
	Injectable,
	Logger,
	type OnApplicationBootstrap,
} from "@nestjs/common";
import {
	isKnownOrderEventType,
	ORDER_EVENTS_TOPIC,
	orderEventSchema,
} from "../../events/order-events.js";
import { KafkaConsumerService } from "../../kafka/service/kafka-consumer.service.js";
import {
	type ConsumedMessage,
	PoisonMessageError,
} from "../../kafka/types/kafka.types.js";
import { NotificationsService } from "../service/notifications.service.js";

export const NOTIFICATIONS_GROUP = "notifications";

/** Turns order domain events into customer notifications. Add instances (up to the partition count) to scale. */
@Injectable()
export class NotificationsConsumer implements OnApplicationBootstrap {
	private readonly logger = new Logger(NotificationsConsumer.name);

	constructor(
		private readonly kafka: KafkaConsumerService,
		private readonly notifications: NotificationsService,
	) {}

	async onApplicationBootstrap() {
		await this.kafka.subscribe({
			groupId: NOTIFICATIONS_GROUP,
			topics: [ORDER_EVENTS_TOPIC],
			handler: (message) => this.handle(message),
		});
	}

	async handle(message: ConsumedMessage): Promise<void> {
		let json: unknown;
		try {
			json = JSON.parse(message.value);
		} catch {
			throw new PoisonMessageError("Message is not valid JSON");
		}

		const parsed = orderEventSchema.safeParse(json);
		if (!parsed.success) {
			const type = (json as { type?: unknown } | null)?.type;
			if (isKnownOrderEventType(type)) {
				throw new PoisonMessageError(
					`Invalid ${String(type)} event: ${parsed.error.message}`,
				);
			}
			this.logger.warn(`Skipping unknown event type ${String(type)}`);
			return;
		}
		await this.notifications.createFromEvent(parsed.data);
	}
}

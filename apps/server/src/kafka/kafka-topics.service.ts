import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { Admin } from "@platformatic/kafka";
import { getKafkaConfig } from "./kafka.config.js";
import { TOPICS } from "./topics.js";

/** Creates missing topics at startup (idempotent) so a fresh environment works without manual setup. */
@Injectable()
export class KafkaTopicsService implements OnModuleInit {
	private readonly logger = new Logger(KafkaTopicsService.name);

	async onModuleInit() {
		const { clientId, bootstrapBrokers, partitions, replicationFactor } =
			getKafkaConfig();
		const admin = new Admin({
			clientId: `${clientId}-admin`,
			bootstrapBrokers,
		});
		try {
			const existing = new Set(await admin.listTopics());
			for (const topic of TOPICS.filter(({ name }) => !existing.has(name))) {
				await admin.createTopics({
					topics: [topic.name],
					partitions: topic.scale ? partitions : 1,
					replicas: replicationFactor,
				});
				this.logger.log(`Created topic ${topic.name}`);
			}
		} finally {
			await admin.close();
		}
	}
}

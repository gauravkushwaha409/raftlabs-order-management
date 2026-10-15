import { Module } from "@nestjs/common";
import { KafkaModule } from "./kafka/kafka.module.js";
import { NotificationsConsumer } from "./notifications/consumer/notifications.consumer.js";
import { NotificationsModule } from "./notifications/notifications.module.js";
import { OutboxRelayService } from "./outbox/service/outbox-relay.service.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { RedisModule } from "./redis/redis.module.js";

/**
 * Everything that talks to Kafka. Runs as its own process (`pnpm --filter server start:worker`) so
 * consumers scale and fail independently of the HTTP API.
 */
@Module({
	imports: [PrismaModule, RedisModule, KafkaModule, NotificationsModule],
	providers: [OutboxRelayService, NotificationsConsumer],
})
export class WorkerModule {}

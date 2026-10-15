import { Global, Module } from "@nestjs/common";
import { KafkaConsumerService } from "./kafka-consumer.service.js";
import { KafkaProducerService } from "./kafka-producer.service.js";
import { KafkaTopicsService } from "./kafka-topics.service.js";

/** Imported by the worker only: the API process never talks to Kafka (it writes to the outbox instead). */
@Global()
@Module({
	providers: [KafkaProducerService, KafkaConsumerService, KafkaTopicsService],
	exports: [KafkaProducerService, KafkaConsumerService],
})
export class KafkaModule {}

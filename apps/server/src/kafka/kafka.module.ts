import { Global, Module } from "@nestjs/common";
import { KafkaConsumerService } from "./service/kafka-consumer.service.js";
import { KafkaProducerService } from "./service/kafka-producer.service.js";
import { KafkaTopicsService } from "./service/kafka-topics.service.js";

/** Imported by the worker only: the API process never talks to Kafka (it writes to the outbox instead). */
@Global()
@Module({
	providers: [KafkaProducerService, KafkaConsumerService, KafkaTopicsService],
	exports: [KafkaProducerService, KafkaConsumerService],
})
export class KafkaModule {}

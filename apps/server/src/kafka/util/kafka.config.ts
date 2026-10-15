export interface KafkaConfig {
	clientId: string;
	bootstrapBrokers: string[];
	partitions: number;
	replicationFactor: number;
}

/** Read lazily (not at import) so env.ts has loaded first and tests can set variables per run. */
export const getKafkaConfig = (): KafkaConfig => ({
	clientId: process.env.KAFKA_CLIENT_ID ?? "raftlabs-server",
	bootstrapBrokers: (process.env.KAFKA_BROKERS ?? "localhost:9094")
		.split(",")
		.map((broker) => broker.trim())
		.filter(Boolean),
	partitions: Number(process.env.KAFKA_PARTITIONS ?? 3),
	replicationFactor: Number(process.env.KAFKA_REPLICATION_FACTOR ?? 1),
});

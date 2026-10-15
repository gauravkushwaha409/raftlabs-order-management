export interface ProducedMessage {
	topic: string;
	key: string;
	value: string;
	headers?: Record<string, string>;
}

export interface ConsumedMessage {
	topic: string;
	partition: number;
	offset: bigint;
	key: string | null;
	value: string;
	headers: Record<string, string>;
}

export type MessageHandler = (message: ConsumedMessage) => Promise<void>;

/**
 * Throw from a handler when retrying cannot help (malformed or semantically invalid message).
 * The message goes straight to the dead-letter topic instead of blocking its partition.
 */
export class PoisonMessageError extends Error {
	override name = "PoisonMessageError";
}

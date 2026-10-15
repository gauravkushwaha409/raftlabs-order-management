import { setTimeout as sleep } from "node:timers/promises";
import {
	type ConsumedMessage,
	type MessageHandler,
	PoisonMessageError,
} from "../types/kafka.types.js";

export interface RetryPolicy {
	maxAttempts: number;
	/** Delay before the first retry; doubles on each following one. */
	backoffMs: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
	maxAttempts: 5,
	backoffMs: 500,
};

export type DeadLetter = (
	message: ConsumedMessage,
	error: unknown,
	attempts: number,
) => Promise<void>;

/**
 * Runs `handler` for one message: transient failures are retried with exponential backoff, poison
 * messages and exhausted retries go to `deadLetter`. Resolves once the message is fully dealt with
 * (safe to commit its offset); rejects only if the dead-letter write itself fails, in which case
 * the offset must stay uncommitted so the message is redelivered.
 */
export async function processMessage(
	message: ConsumedMessage,
	handler: MessageHandler,
	deadLetter: DeadLetter,
	policy: RetryPolicy = DEFAULT_RETRY_POLICY,
	wait: (ms: number) => Promise<unknown> = sleep,
): Promise<void> {
	for (let attempt = 1; ; attempt++) {
		try {
			await handler(message);
			return;
		} catch (error) {
			const retryable =
				!(error instanceof PoisonMessageError) && attempt < policy.maxAttempts;
			if (!retryable) {
				await deadLetter(message, error, attempt);
				return;
			}
			await wait(policy.backoffMs * 2 ** (attempt - 1));
		}
	}
}

import { type QueryKey, useQueryClient } from "@tanstack/react-query";

/**
 * Returns helpers to invalidate one or many query keys.
 *
 * @example
 * const { invalidate, invalidateMany } = useInvalidates();
 *
 * // Invalidate a single key
 * await invalidate(CONFIG.API_KEY.user.all);
 *
 * // Invalidate multiple keys at once
 * await invalidateMany([CONFIG.API_KEY.user.all, CONFIG.API_KEY.ORGANIZATION.all]);
 */
export const useInvalidates = () => {
	const queryClient = useQueryClient();

	/** Invalidate a single query key */
	const invalidate = (key: QueryKey) =>
		queryClient.invalidateQueries({ queryKey: key });

	/** Invalidate multiple query keys in parallel */
	const invalidateMany = (keys: QueryKey[]) =>
		Promise.all(
			keys.map((key) => queryClient.invalidateQueries({ queryKey: key })),
		);

	return { invalidate, invalidateMany };
};

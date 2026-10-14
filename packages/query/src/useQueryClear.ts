import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook to clear all React Query cache.
 */
export const useQueryClear = () => {
	const queryClient = useQueryClient();

	/**
	 * Clears all queries and cached data.
	 */
	const clearAllQueries = () => {
		// Completely removes all cached queries
		queryClient.clear();

		// Optional: reset any active mutations
		queryClient.resetQueries();

		// Explicitly clear mutations (optional, since clear() already does it)
		queryClient.getMutationCache().clear();
	};

	return { clearAllQueries };
};

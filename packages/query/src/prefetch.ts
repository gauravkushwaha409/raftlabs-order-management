import {
	type DehydratedState,
	dehydrate,
	type FetchQueryOptions,
	QueryClient,
} from "@tanstack/react-query";

const getServerQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 0,
				gcTime: 10 * 60 * 1000,
				retry: 1,
				refetchOnWindowFocus: false,
				refetchOnReconnect: false,
				refetchOnMount: false,
			},
		},
	});

/**
 * Prefetch queries on the server and return a dehydrated cache state.
 */
export async function prefetchQueries(
	queries: FetchQueryOptions[],
): Promise<DehydratedState> {
	const queryClient = getServerQueryClient();

	await Promise.all(
		queries.map(({ queryKey, queryFn }) =>
			queryClient.prefetchQuery({ queryKey, queryFn, staleTime: 0 }),
		),
	);

	return dehydrate(queryClient);
}

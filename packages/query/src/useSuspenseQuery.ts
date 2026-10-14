"use client";

import {
	type DefaultError,
	type QueryKey,
	type UseSuspenseQueryOptions,
	useSuspenseQuery as useTanstackSuspenseQuery,
} from "@tanstack/react-query";

export function useSuspenseQuery<
	TQueryFnData = unknown,
	TError = DefaultError,
	TData = TQueryFnData,
	TParams = unknown,
>(
	queryKey: QueryKey,
	fetchFn: (params?: TParams) => Promise<TQueryFnData>,
	params?: TParams,
	options?: Omit<
		UseSuspenseQueryOptions<TQueryFnData, TError, TData, QueryKey>,
		"queryKey" | "queryFn"
	>,
) {
	return useTanstackSuspenseQuery<TQueryFnData, TError, TData, QueryKey>({
		queryKey: queryKey,
		queryFn: async () => {
			return fetchFn(params);
		},

		retry: 1,
		staleTime: 1000 * 60 * 5,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		...options,
	});
}

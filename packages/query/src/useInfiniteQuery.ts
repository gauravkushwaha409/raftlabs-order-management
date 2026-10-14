import {
	type DefaultError,
	type InfiniteData,
	type QueryKey,
	type UseInfiniteQueryOptions,
	useInfiniteQuery as useTanstackInfiniteQuery,
} from "@tanstack/react-query";

export function useInfiniteQuery<
	TQueryFnData = unknown,
	TError = DefaultError,
	TData = InfiniteData<TQueryFnData>,
	TQueryKey extends QueryKey = QueryKey,
	TPageParam = unknown,
>(
	options: UseInfiniteQueryOptions<
		TQueryFnData,
		TError,
		TData,
		TQueryKey,
		TPageParam
	>,
) {
	return useTanstackInfiniteQuery(options);
}

export type { InfiniteData, UseInfiniteQueryOptions };

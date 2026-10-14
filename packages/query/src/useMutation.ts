import {
	type DefaultError,
	type QueryKey,
	type UseMutationOptions,
	useQueryClient,
	useMutation as useTanstackMutation,
} from "@tanstack/react-query";

/**
 * TData: The data returned by the API
 * TError: The error type
 * TVariables: The object/params passed to the mutate function (e.g., the body)
 * TContext: Used for optimistic updates (optional)
 */
export function useMutation<
	TData = unknown,
	TError = DefaultError,
	TVariables = void,
	TContext = unknown,
>(
	mutationFn: (variables: TVariables) => Promise<TData>,
	options?: UseMutationOptions<TData, TError, TVariables, TContext> & {
		invalidateKeys?: QueryKey[];
	},
) {
	const queryClient = useQueryClient();
	const { invalidateKeys, onSuccess, ...restOptions } = options || {};

	return useTanstackMutation<TData, TError, TVariables, TContext>({
		mutationFn,
		onSuccess: async (data, variables, mutationResult, context) => {
			if (invalidateKeys) {
				await Promise.all(
					invalidateKeys.map((key) =>
						queryClient.invalidateQueries({ queryKey: key }),
					),
				);
			}

			if (options?.onSuccess) {
				return options.onSuccess(data, variables, mutationResult, context);
			}
		},
		...restOptions,
	});
}

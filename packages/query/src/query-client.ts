import { QueryClient, type QueryClientConfig } from "@tanstack/react-query";

export const createQueryClient = (config?: QueryClientConfig) => {
	return new QueryClient(
		config
			? config
			: {
					defaultOptions: {
						queries: {
							staleTime: 1000 * 60 * 5, // 5 minutes
							gcTime: 1000 * 60 * 60 * 24, // 24 hours — must match maxAge
							retry: 0,
							refetchOnWindowFocus: false,
						},
						mutations: {
							retry: 0,
						},
					},
				},
	);
};

import { createQueryClient, TanstackQueryProvider } from "@package/query";
import { Toaster } from "@package/ui";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const queryClient = createQueryClient();
const router = createRouter({ routeTree, context: { queryClient } });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

export function App() {
	return (
		<TanstackQueryProvider client={queryClient}>
			<Toaster position="bottom-right" duration={2500} />
			<RouterProvider router={router} />
		</TanstackQueryProvider>
	);
}

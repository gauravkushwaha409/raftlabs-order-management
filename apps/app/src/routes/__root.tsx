import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	Link,
	Outlet,
} from "@tanstack/react-router";
import { UtensilsCrossedIcon } from "lucide-react";
import { AuthMenu } from "@/features/auth/auth-menu";
import { CartSheet } from "@/features/cart/cart-sheet";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
	{
		component: RootLayout,
	},
);

function RootLayout() {
	return (
		<div className="min-h-screen bg-background-base">
			<header className="sticky top-0 z-40 border-b border-gray-border-200 bg-white-base/90 backdrop-blur">
				<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
					<Link to="/" className="typo-h5 flex items-center gap-2 text-gray-800">
						<UtensilsCrossedIcon className="text-primary-500" />
						Raftlabs Food
					</Link>
					<div className="flex items-center gap-3">
						<AuthMenu />
						<CartSheet />
					</div>
				</div>
			</header>
			<main className="mx-auto max-w-6xl px-4 py-8">
				<Outlet />
			</main>
		</div>
	);
}

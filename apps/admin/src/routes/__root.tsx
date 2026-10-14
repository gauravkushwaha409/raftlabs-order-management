import { Button } from "@package/ui";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { ShieldCheckIcon } from "lucide-react";
import { useAdmin, useLogout } from "@/features/auth/session";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
	{
		component: RootLayout,
	},
);

function RootLayout() {
	const admin = useAdmin();
	const logout = useLogout();

	return (
		<div className="min-h-screen bg-background-base">
			<header className="border-b border-gray-border-200 bg-white-base">
				<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
					<h1 className="typo-h5 flex items-center gap-2 text-gray-800">
						<ShieldCheckIcon className="text-primary-500" />
						Raftlabs Admin
					</h1>
					{admin.data && (
						<Button
							variant="secondary"
							size="sm"
							className="w-auto"
							onClick={() => logout.mutate()}
						>
							Sign out
						</Button>
					)}
				</div>
			</header>
			<main className="mx-auto max-w-6xl px-4 py-8">
				<Outlet />
			</main>
		</div>
	);
}

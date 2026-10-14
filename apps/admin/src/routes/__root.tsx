import { Input } from "@package/ui";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import { Sidebar } from "@/components/shared/sidebar";
import { useAdmin } from "@/features/auth/session";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
	{
		component: RootLayout,
	},
);

/**
 * Mirrors chat-app `routes/_organization-protected/$organization.tsx`:
 * sidebar on the left, header (search + notifications) up top, and the
 * route outlet inside a rounded content card.
 * Logged-out users (login form) get a plain centered layout with no sidebar.
 */
function RootLayout() {
	const admin = useAdmin();

	if (admin.isPending) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50">
				<div
					role="status"
					aria-label="Loading"
					className="h-48 w-full max-w-md animate-pulse rounded-xl bg-gray-100"
				/>
			</div>
		);
	}

	if (!admin.data) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background-base px-4">
				<Outlet />
			</div>
		);
	}

	return (
		<section className="flex h-screen overflow-hidden bg-gray-50">
			<Sidebar />

			<section className="flex min-w-0 flex-1 flex-col py-2.5">
				<header className="flex items-center justify-between px-5 pb-2.5">
					<Input
						leftIcon={<Search size={18} className="text-gray-400" />}
						className="w-100 border-gray-200 bg-white-base"
						placeholder="Quick Search"
						rightIcon={
							<div className="flex gap-1.5 text-primary-400">
								<kbd className="rounded-xs bg-primary-50 p-px text-[11px] leading-none">
									⌘
								</kbd>
								<kbd className="rounded-xs bg-primary-50 p-px text-[11px] leading-none">
									K
								</kbd>
							</div>
						}
					/>
					<button
						type="button"
						aria-label="Notifications"
						className="flex size-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-fill-50 hover:text-gray-700"
					>
						<Bell size={20} />
					</button>
				</header>

				<div className="flex-1 overflow-y-auto rounded-l-[12px] border border-gray-border-50 bg-white-base shadow-sm">
					<div className="mx-auto max-w-6xl px-4 py-8">
						<Outlet />
					</div>
				</div>
			</section>
		</section>
	);
}

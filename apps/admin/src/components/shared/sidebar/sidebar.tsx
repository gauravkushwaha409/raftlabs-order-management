import { useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useAdmin, useLogout } from "@/features/auth/session";
import {
	getSidebarData,
	SIDEBAR_WIDTH,
	SIDEBAR_WIDTH_ICON,
} from "./sidebar.constants";
import { SidebarPanel } from "./sidebar-panel";

/**
 * Admin port of chat-app `Sidebar`.
 * Same collapse / hover-expand / floating behaviour; admin has no
 * organization scope, so the header is a static brand slot and the
 * footer reads the admin session.
 */
export function Sidebar() {
	const [collapsed, setCollapsed] = useState(true);
	const [hovered, setHovered] = useState(false);

	const { data: admin } = useAdmin();
	const logoutMutation = useLogout();

	const open = !collapsed || hovered;
	const isFloating = collapsed && hovered;

	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});

	const sidebarData = getSidebarData();

	const handleLogout = () => {
		logoutMutation.mutate();
	};

	return (
		<section
			aria-hidden={collapsed && !hovered}
			style={{
				width: collapsed ? SIDEBAR_WIDTH_ICON : SIDEBAR_WIDTH,
				flexShrink: 0,
			}}
			className="relative h-full transition-[width] duration-300 ease-in-out"
			onMouseEnter={() => {
				if (collapsed) setHovered(true);
			}}
			onMouseLeave={() => {
				if (collapsed) setHovered(false);
			}}
		>
			<SidebarPanel
				open={open}
				isFloating={isFloating}
				collapsed={collapsed}
				hovered={hovered}
				pathname={pathname}
				sidebarData={sidebarData}
				user={admin}
				onLogout={handleLogout}
				isLoggingOut={logoutMutation.isPending}
				onPin={() => {
					setCollapsed(false);
					setHovered(false);
				}}
				onCollapse={() => setCollapsed(true)}
			/>
		</section>
	);
}

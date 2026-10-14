import { cn } from "@package/ui";
import type { User } from "@/types/api";
import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON } from "./sidebar.constants";
import type { SidebarItems } from "./sidebar.types";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarHeader } from "./sidebar-header";
import { SidebarNav } from "./sidebar-nav";

interface SidebarPanelProps {
	open: boolean;
	isFloating: boolean;
	collapsed: boolean;
	hovered: boolean;
	pathname: string;
	sidebarData: SidebarItems;
	user: User | null | undefined;
	onLogout: () => void;
	isLoggingOut?: boolean;
	onPin: () => void;
	onCollapse: () => void;
}

export function SidebarPanel({
	open,
	isFloating,
	collapsed,
	hovered,
	pathname,
	sidebarData,
	user,
	onLogout,
	isLoggingOut,
	onPin,
	onCollapse,
}: SidebarPanelProps) {
	return (
		<section
			style={{ width: open ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_ICON }}
			className={cn(
				"relative flex h-full flex-col justify-between space-y-3 overflow-hidden py-3 transition-[width] duration-300 ease-in-out",
				isFloating &&
					"absolute inset-y-0 left-0 z-40 rounded-r-[12px] border-r border-gray-200 bg-white-base shadow-[2px_0_15px_0_rgba(0,0,0,0.03)]",
			)}
		>
			<SidebarHeader
				open={open}
				hovered={hovered}
				onPin={onPin}
				onCollapse={onCollapse}
			/>
			<SidebarNav
				sidebarData={sidebarData}
				pathname={pathname}
				open={open}
				isFloating={isFloating}
				collapsed={collapsed}
				hovered={hovered}
			/>
			<SidebarFooter
				open={open}
				user={user}
				onLogout={onLogout}
				isLoggingOut={isLoggingOut}
			/>
		</section>
	);
}

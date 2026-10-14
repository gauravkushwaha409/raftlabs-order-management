import type { LucideIcon } from "lucide-react";

export interface SidebarItem {
	label: string;
	icon: LucideIcon;
	path: string;
	matchPath?: string;
	/** Data-driven badge - rendered by NavLink (pill when open, dot when collapsed). */
	badge?: React.ReactNode;
}

export interface SidebarItems {
	UPPER: SidebarItem[];
	LOWER: SidebarItem[];
}

import { Settings, ShoppingCart } from "lucide-react";
import type { SidebarItems } from "./sidebar.types";

export const SIDEBAR_WIDTH = "220px";
export const SIDEBAR_WIDTH_ICON = "68px";

/**
 * Mirrors chat-app `getSidebarData` — split into UPPER / LOWER nav groups.
 * Admin has no organization scope, so paths are absolute.
 */
export const getSidebarData = (): SidebarItems => ({
	UPPER: [
		{
			label: "Orders",
			icon: ShoppingCart,
			path: "/",
		},
	],
	LOWER: [
		{
			label: "Settings",
			icon: Settings,
			path: "/settings",
			matchPath: "/settings",
		},
	],
});

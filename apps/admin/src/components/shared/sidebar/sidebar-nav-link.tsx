import { cn, Typography } from "@package/ui";
import { Link } from "@tanstack/react-router";
import type { SidebarItem } from "./sidebar.types";

interface NavLinkProps {
	item: SidebarItem;
	pathname: string;
	open: boolean;
	isFloating: boolean;
}

export function NavLink({ item, pathname, open, isFloating }: NavLinkProps) {
	// Same segment-prefix matching as chat-app sidebar-nav-link.
	const activePath = item.matchPath ?? item.path;
	const itemSegs = activePath.split("/").filter(Boolean);
	const pathSegs = pathname.split("/").filter(Boolean);

	const isActive =
		itemSegs.length === 0
			? pathSegs.length === 0
			: itemSegs.length <= pathSegs.length &&
				itemSegs.every((seg, i) => seg === pathSegs[i]);

	const ItemIcon = item.icon;

	return (
		<Link
			to={item.path}
			title={!open ? item.label : undefined}
			activeOptions={{ exact: itemSegs.length === 0 }}
			className={cn(
				"relative flex h-9 flex-row items-center rounded-[6px]",
				"gap-2 border border-transparent px-2.5",
				!open && "gap-0 px-2",
				isFloating && "gap-2",
				isActive &&
					"border-primary-200 bg-white-base shadow-[0_4px_10px_hsla(0,0%,0%,0.05)]",
			)}
		>
			<span
				className={cn(
					"flex size-5 shrink-0 items-center justify-center",
					isActive && "text-primary-500",
				)}
			>
				<ItemIcon size={20} />
			</span>
			<span
				className={cn(
					"flex flex-1 items-center justify-between gap-2 overflow-hidden whitespace-nowrap",
					open ? "max-w-40 opacity-100" : "max-w-0 opacity-0",
				)}
			>
				<Typography.T3
					weight="medium"
					className={cn("truncate text-gray-800", isActive && "text-primary-500")}
				>
					{item.label}
				</Typography.T3>
				{item.badge && open ? (
					<span className="ml-auto flex h-5 items-center justify-center rounded-[6px] border border-gray-border-200 bg-white-base px-1.5 text-gray-500 shadow-[0px_4px_12px_rgba(0,0,0,0.04)] backdrop-blur-xl">
						<Typography.Cap weight="medium">{item.badge}</Typography.Cap>
					</span>
				) : null}
			</span>
			{item.badge && !open ? (
				<span className="absolute right-1 bottom-1 size-1 rounded-full bg-warning-600" />
			) : null}
		</Link>
	);
}

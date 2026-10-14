import { cn, Typography } from "@package/ui";
import { PanelLeftClose, Pin } from "lucide-react";

interface SidebarHeaderProps {
	open: boolean;
	hovered: boolean;
	onPin: () => void;
	onCollapse: () => void;
}

function getInitial(name: string) {
	return name.trim().charAt(0).toUpperCase() || "?";
}

function BrandAvatar({ name, className }: { name: string; className?: string }) {
	return (
		<div
			className={cn(
				"flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-linear-to-t from-primary-950 to-primary-500 font-bold text-sm text-white shadow-sm",
				className,
			)}
		>
			{getInitial(name)}
		</div>
	);
}

/**
 * Admin equivalent of chat-app `SidebarHeader`.
 * No organization switcher here — static brand slot + pin / collapse actions.
 */
export function SidebarHeader({
	open,
	hovered,
	onPin,
	onCollapse,
}: SidebarHeaderProps) {
	const brandName = "Raftlabs Admin";

	return (
		<section className="px-3">
			<section className="flex justify-between gap-1">
				<div className="flex min-w-0 flex-1 items-center gap-1 rounded-[6px] p-1 -m-1">
					<BrandAvatar name={brandName} />
					<div
						className={cn(
							"flex flex-1 items-center gap-1 overflow-hidden whitespace-nowrap",
							open ? "max-w-40 opacity-100" : "max-w-0 opacity-0",
						)}
					>
						<Typography.T3
							weight="medium"
							className="max-w-28 overflow-hidden text-ellipsis text-start text-gray-800"
						>
							{brandName}
						</Typography.T3>
					</div>
				</div>

				<div className="ml-auto flex shrink-0 items-center gap-1">
					{hovered && (
						<button
							className="h-5 w-5 cursor-pointer text-gray-400 hover:text-gray-600"
							type="button"
							onClick={onPin}
							aria-label="Pin sidebar open"
							title="Click to Pin"
						>
							<Pin size={20} />
						</button>
					)}
					{!open ? null : !hovered ? (
						<button
							type="button"
							className="h-5 w-5 cursor-pointer text-gray-400 hover:text-gray-600"
							onClick={onCollapse}
							aria-label="Collapse sidebar"
							title="Close sidebar"
						>
							<PanelLeftClose size={20} />
						</button>
					) : null}
				</div>
			</section>
		</section>
	);
}

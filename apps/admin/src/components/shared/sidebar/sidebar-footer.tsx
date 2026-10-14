import {
	Avatar,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Typography,
} from "@package/ui";
import { ChevronUp, LogOut } from "lucide-react";
import type { User } from "@/types/api";

interface SidebarFooterProps {
	open: boolean;
	user: User | null | undefined;
	onLogout: () => void;
	isLoggingOut?: boolean;
}

/** Mirrors chat-app `SidebarFooter` — user chip + logout dropdown. */
export function SidebarFooter({
	open,
	user,
	onLogout,
	isLoggingOut,
}: SidebarFooterProps) {
	const fullName = user?.name?.trim() || user?.email || "Admin";
	const email = user?.email || "";

	return (
		<section className="shrink-0 px-3">
			<DropdownMenu>
				<DropdownMenuTrigger
					disabled={!open}
					className="group -m-1 flex w-full items-center gap-3 rounded-[6px] p-1 disabled:cursor-default enabled:hover:bg-gray-fill-50"
				>
					<Avatar
						size="xl"
						fallbackType="text"
						fallbackText={fullName}
						className="bg-gray-200"
					/>
					<section
						className={cn(
							"flex flex-1 items-center gap-1 overflow-hidden whitespace-nowrap",
							open ? "max-w-40 opacity-100" : "max-w-0 opacity-0",
						)}
					>
						<div className="flex flex-1 flex-col overflow-hidden text-start">
							<Typography.T3
								weight="medium"
								className="max-w-32 truncate text-gray-950"
							>
								{fullName}
							</Typography.T3>
							<Typography.T5
								weight="regular"
								className="max-w-32 truncate text-gray-400"
							>
								{email}
							</Typography.T5>
						</div>
						<ChevronUp
							size={12}
							className="shrink-0 text-gray-400 transition-transform group-data-[state=open]:rotate-180"
						/>
					</section>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" side="top" className="w-56">
					<DropdownMenuItem
						variant="danger"
						disabled={isLoggingOut}
						onSelect={onLogout}
					>
						<LogOut size={16} />
						{isLoggingOut ? "Logging out…" : "Log out"}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</section>
	);
}

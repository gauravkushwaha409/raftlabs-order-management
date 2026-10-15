import {
	Button,
	cn,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@package/ui";
import { useNavigate } from "@tanstack/react-router";
import { BellIcon } from "lucide-react";
import { useState } from "react";
import type { Notification } from "@/types/api";
import { useMe } from "../auth/session";
import { useNotifications } from "./use-notifications";

/** Renders nothing for visitors; the stream only opens for signed-in users. */
export function NotificationBell() {
	const me = useMe();
	return me.data ? <SignedInBell /> : null;
}

function SignedInBell() {
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();
	const { feed, markRead, markAllRead } = useNotifications();

	const openOrder = (notification: Notification) => {
		markRead(notification.id);
		setOpen(false);
		void navigate({
			to: "/orders/$orderId",
			params: { orderId: notification.orderId },
		});
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="secondary"
					size="sm"
					className="relative w-auto"
					aria-label={`Notifications, ${feed.unreadCount} unread`}
				>
					<BellIcon />
					{feed.unreadCount > 0 && (
						<span
							aria-hidden
							className="typo-t5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1 text-white-base"
						>
							{feed.unreadCount}
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-80 p-0">
				<div className="flex items-center justify-between border-b border-gray-border-200 px-4 py-3">
					<h2 className="typo-t2 text-gray-800">Notifications</h2>
					{feed.unreadCount > 0 && (
						<button
							type="button"
							className="typo-t4 text-primary-500 hover:underline"
							onClick={() => markAllRead()}
						>
							Mark all read
						</button>
					)}
				</div>
				{feed.items.length === 0 ? (
					<p className="typo-t4 px-4 py-8 text-center text-gray-500">
						Nothing yet. Order updates show up here.
					</p>
				) : (
					<ul className="max-h-96 overflow-y-auto">
						{feed.items.map((notification) => (
							<li key={notification.id}>
								<button
									type="button"
									onClick={() => openOrder(notification)}
									className={cn(
										"flex w-full flex-col gap-0.5 px-4 py-3 text-left hover:bg-gray-50",
										!notification.read && "bg-primary-50",
									)}
								>
									<span className="typo-t3 text-gray-800">{notification.title}</span>
									<span className="typo-t4 text-gray-600">{notification.body}</span>
									<time
										dateTime={notification.createdAt}
										className="typo-t5 text-gray-400"
									>
										{new Date(notification.createdAt).toLocaleTimeString([], {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</time>
								</button>
							</li>
						))}
					</ul>
				)}
			</PopoverContent>
		</Popover>
	);
}

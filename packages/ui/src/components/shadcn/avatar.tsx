import { type LucideIcon, UserIcon } from "lucide-react";
import { Avatar as AvatarPrimitive } from "radix-ui";
import * as React from "react";
import { cn } from "#lib/utils";

export type AvatarSize = "xs" | "sm" | "md" | "default" | "lg" | "xl" | "2xl";
type AvatarFallbackType = "text" | "icon";

interface AvatarGroupContextValue {
	size: AvatarSize;
}

const AvatarGroupContext = React.createContext<AvatarGroupContextValue>({
	size: "default",
});

interface AvatarGroupProps extends React.ComponentProps<"div"> {
	size?: AvatarSize;
	max?: number;
}

function AvatarGroup({
	className,
	size = "default",
	max,
	children,
	...props
}: AvatarGroupProps) {
	const childArray = React.Children.toArray(children);
	const visibleChildren = max ? childArray.slice(0, max) : childArray;
	const overflowCount = max ? childArray.length - max : 0;

	return (
		<AvatarGroupContext.Provider value={{ size }}>
			<div
				data-slot="avatar-group"
				className={cn(
					"flex -space-x-2",
					"[&>[data-slot='avatar']]:ring-2 [&>[data-slot='avatar']]:ring-white-base",
					className,
				)}
				{...props}
			>
				{visibleChildren}
				{overflowCount > 0 && <AvatarGroupCount>+{overflowCount}</AvatarGroupCount>}
			</div>
		</AvatarGroupContext.Provider>
	);
}

function AvatarGroupCount({
	className,
	children,
	...props
}: React.ComponentProps<"div">) {
	const { size } = React.useContext(AvatarGroupContext);
	const config = avatarConfig[size];

	return (
		<div
			data-slot="avatar-group-count"
			className={cn(
				"relative flex shrink-0 items-center justify-center rounded-full",
				"bg-gray-active-1 font-medium ",
				"ring-2 ring-white-base",
				config.size,
				config.text,
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

interface AvatarProps
	extends Omit<React.ComponentProps<typeof AvatarPrimitive.Root>, "children"> {
	size?: AvatarSize;
	image?: string | undefined;
	alt?: string;
	fallbackText?: string;
	fallbackType?: AvatarFallbackType;
	icon?: LucideIcon;
	isActive?: boolean;
	showAvatarBadge?: boolean;
	imageClassName?: string;
}

const avatarConfig: Record<
	AvatarSize,
	{
		size: string;
		text: string;
		icon: number;
		badge: string;
	}
> = {
	xs: {
		size: "size-5",
		text: "text-[8px] leading-none",
		icon: 12,
		badge: "size-[5px]",
	},
	sm: {
		size: "size-[26px]",
		text: "text-xs leading-none",
		icon: 13,
		badge: "size-[6px]",
	},
	default: {
		size: "size-8",
		text: "text-sm leading-none",
		icon: 14,
		badge: "size-[7px]",
	},
	md: {
		size: "size-[30px]",
		text: "text-sm leading-none",
		icon: 16,
		badge: "size-[7px]",
	},
	lg: {
		size: "size-9",
		text: "text-base leading-none",
		icon: 16,
		badge: "size-[10px]",
	},
	xl: {
		size: "size-11",
		text: "text-lg leading-none",
		icon: 20,
		badge: "size-3",
	},
	"2xl": {
		size: "size-14",
		text: "text-xl leading-none",
		icon: 24,
		badge: "size-4",
	},
};

const getInitials = (text?: string) =>
	text
		?.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((word) => word[0])
		.join("")
		.toUpperCase() || "";

function Avatar({
	size = "default",
	image,
	alt,
	fallbackText,
	fallbackType = "text",
	icon: FallbackIcon = UserIcon,
	isActive = false,
	showAvatarBadge = false,
	imageClassName,
	className,
	...props
}: AvatarProps) {
	const config = avatarConfig[size];

	return (
		<AvatarPrimitive.Root
			data-slot="avatar"
			className={cn(
				"group/avatar relative text-gray-700 flex shrink-0 rounded-full bg-gray-active-1 backdrop-blur-[10px]",
				config.size,
				className,
			)}
			{...props}
		>
			{image ? (
				<AvatarPrimitive.Image
					src={image}
					alt={alt}
					loading="lazy"
					decoding="async"
					referrerPolicy="no-referrer"
					className={cn(
						"h-full w-full rounded-full object-cover object-top",
						imageClassName,
					)}
				/>
			) : (
				<AvatarPrimitive.Fallback className="flex size-full items-center justify-center rounded-full">
					{fallbackType === "icon" ? (
						<FallbackIcon size={config.icon} className="text-gray-500" />
					) : !fallbackText ? (
						<p className={cn("font-medium ", config.text)}>
							{getInitials("chatboq App")}
						</p>
					) : (
						<p className={cn("font-medium ", config.text)}>
							{getInitials(fallbackText)}
						</p>
					)}
				</AvatarPrimitive.Fallback>
			)}

			{showAvatarBadge && (
				<span
					className={cn(
						"absolute right-0 bottom-0 z-10 rounded-full ring-1 ring-white-base",
						isActive ? "bg-green-500" : "bg-gray-400",
						config.badge,
					)}
				/>
			)}
		</AvatarPrimitive.Root>
	);
}

export { Avatar, AvatarGroup, AvatarGroupCount };

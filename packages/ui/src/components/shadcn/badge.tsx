import { cva, type VariantProps } from "class-variance-authority";
import { DotIcon, XIcon } from "lucide-react";
import { cn } from "#lib/utils";

const badgeVariants = cva(
	"group/badge flex w-fit items-center gap-[2px] overflow-hidden border border-gray-border-200 font-normal whitespace-nowrap text-gray-800 transition-all",
	{
		variants: {
			variant: {
				default: "bg-none",
				secondary: "bg-gray-fill-50",
				success: "border-green-border bg-green-fill text-green-primary",
				info: "border-info-border bg-info-fill text-info-primary",
				warning: "border-orange-border bg-orange-fill text-orange-primary",
				alert: "border-alert-100 bg-alert-25 text-alert-600",
				"alert-shade": "border-alert-100 bg-alert-25 text-alert-500",
				magenta: "border-magenta-border bg-magenta-fill text-magenta-primary",
			},
			size: {
				xs: "typo-t5 leading-0 h-[22px] px-[6px]",
				sm: "typo-t3 leading-0 h-6 px-2",
				default: "typo-t3 leading-0 h-7 px-2",
				lg: "typo-t1 leading-0 h-8 px-2.5",
			},
			radius: {
				default: "rounded-[6px]",
				rounded: "rounded-full",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
			radius: "default",
		},
	},
);

export interface BadgeProps
	extends React.ComponentProps<"span">,
		VariantProps<typeof badgeVariants> {
	asChild?: boolean;
	dot?: boolean;
	removable?: boolean;
	onRemove?: () => void;
	outline?: boolean;
	dotVariant?: VariantProps<typeof badgeDotVariants>["variant"];
	dotClassName?: string;
}

const badgeDotVariants = cva("shrink-0 rounded-full", {
	variants: {
		variant: {
			default: "text-gray-600",
			secondary: "text-gray-500",
			success: "text-green-primary",
			info: "text-info-primary",
			warning: "text-orange-primary",
			magenta: "text-magenta-primary",
			alert: "text-alert-600",
			"alert-shade": "text-alert-500",
		},
		size: {
			xs: "size-[6px]",
			sm: "size-[6px]",
			default: "size-[8px]",
			lg: "size-[10px]",
		},
	},
	defaultVariants: {
		variant: "default",
		size: "default",
	},
});

const removeIconVariants = cva("cursor-pointer", {
	variants: {
		variant: {
			default: "text-gray-600",
			secondary: "text-gray-500",
			success: "text-green-primary",
			info: "text-info-primary",
			warning: "text-orange-primary",
			magenta: "text-magenta-primary",
			alert: "text-alert-600",
			"alert-shade": "text-alert-500",
		},
		size: {
			xs: "h-3 w-3",
			sm: "h-3.5 w-3.5",
			default: "h-3.5 w-3.5",
			lg: "h-4 w-4",
		},
	},
	defaultVariants: {
		variant: "default",
		size: "default",
	},
});

function Badge({
	className,
	variant,
	size,
	radius,
	asChild = false,
	dot = false,
	dotVariant,
	removable = false,
	onRemove,
	outline = false,
	children,
	dotClassName,
	...props
}: BadgeProps) {
	const outlineClasses = outline && "bg-transparent";
	const finalDotVariant = dotVariant ?? variant;
	return (
		<span
			data-slot="badge"
			data-variant={variant}
			data-size={size}
			data-radius={radius}
			className={cn(
				badgeVariants({ variant, size, radius }),
				variant && outline && outlineClasses,
				className,
			)}
			{...props}
		>
			{dot && (
				<DotIcon
					data-icon="inline-start"
					className={cn(
						badgeDotVariants({ variant: finalDotVariant, size }),
						dotClassName,
					)}
				/>
			)}

			{children}

			{removable && (
				<button
					type="button"
					data-icon="inline-end"
					onClick={(e) => {
						e.stopPropagation();
						onRemove?.();
					}}
				>
					<XIcon className={cn(removeIconVariants({ variant, size }))} />
				</button>
			)}
		</span>
	);
}

export { Badge, badgeVariants };

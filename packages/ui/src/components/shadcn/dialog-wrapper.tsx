import type React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#components/base-ui/dialog";
import { cn } from "#lib/utils";

export type DialogSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";

const DIALOG_SIZE_CLASSES: Record<DialogSize, string> = {
	sm: "sm:max-w-md",
	md: "sm:max-w-lg",
	lg: "sm:max-w-2xl",
	xl: "sm:max-w-4xl",
	"2xl": "sm:max-w-5xl",
	"3xl": "sm:max-w-6xl",
	full: "sm:max-w-[95vw] lg:max-w-[90vw]",
};

interface DialogWrapperProps
	extends Pick<React.ComponentProps<typeof Dialog>, "open" | "onOpenChange"> {
	title?: React.ReactNode;
	description?: React.ReactNode;
	children?: React.ReactNode;
	footer?: React.ReactNode;
	trigger?: React.ReactNode;

	contentClassName?: string;
	bodyClassName?: string;
	size?: DialogSize;
	isLoading?: boolean;
	showCloseButton?: boolean;
	applyContentClassNameToBody?: boolean;

	// Dialog Props
	dialogProps?: Omit<
		React.ComponentProps<typeof Dialog>,
		"open" | "onOpenChange"
	>;
	dialogTriggerProps?: React.ComponentProps<typeof DialogTrigger>;
	dialogContentProps?: React.ComponentProps<typeof DialogContent>;
	dialogHeaderProps?: React.ComponentProps<typeof DialogHeader>;
	dialogTitleProps?: React.ComponentProps<typeof DialogTitle>;
	dialogDescriptionProps?: React.ComponentProps<typeof DialogDescription>;
	dialogFooterProps?: React.ComponentProps<typeof DialogFooter>;
}

export const DialogWrapper = ({
	open,
	onOpenChange,
	title,
	description,
	isLoading = false,
	contentClassName,
	bodyClassName,
	size = "lg",
	showCloseButton = true,
	applyContentClassNameToBody = true,
	children,
	footer,
	trigger,

	// Optimised Version
	dialogProps,
	dialogTriggerProps,
	dialogContentProps,
	dialogHeaderProps,
	dialogTitleProps,
	dialogDescriptionProps,
	dialogFooterProps,
}: DialogWrapperProps) => {
	const { ...restDialogProps } = dialogProps || {};
	const { asChild, ...restDialogTriggerProps } = dialogTriggerProps || {};
	const { className: contentClassNameProp, ...restDialogContentProps } =
		dialogContentProps || {};
	const { className: headerClassNameProp, ...restDialogHeaderProps } =
		dialogHeaderProps || {};
	const { className: titleClassNameProp, ...restDialogTitleProps } =
		dialogTitleProps || {};
	const { className: descriptionClassNameProp, ...restDialogDescriptionProps } =
		dialogDescriptionProps || {};
	const { className: footerClassNameProp, ...restDialogFooterProps } =
		dialogFooterProps || {};

	return (
		<Dialog open={open} onOpenChange={onOpenChange} {...restDialogProps}>
			{trigger && (
				<DialogTrigger asChild {...restDialogTriggerProps}>
					{trigger}
				</DialogTrigger>
			)}

			<DialogContent
				showCloseButton={showCloseButton}
				className={cn(
					"flex max-h-[90vh] flex-col gap-4",
					DIALOG_SIZE_CLASSES[size],
					contentClassName,
					contentClassNameProp,
				)}
				{...restDialogContentProps}
			>
				<DialogHeader
					className={cn("px-1", headerClassNameProp)}
					{...restDialogHeaderProps}
				>
					{title && (
						<DialogTitle
							className={cn(
								"text-xl font-bold tracking-tight text-gray-900",
								titleClassNameProp,
							)}
							{...restDialogTitleProps}
						>
							{title}
						</DialogTitle>
					)}

					{description && (
						<DialogDescription
							className={cn("text-muted-foreground", descriptionClassNameProp)}
							{...restDialogDescriptionProps}
						>
							{description}
						</DialogDescription>
					)}
				</DialogHeader>

				<div
					className={cn(
						"scrollbar-thin scrollbar-thumb-gray-200 relative flex-1 overflow-y-auto px-1 py-2",
						isLoading ? "flex min-h-50 items-center justify-center" : "min-h-0",
						applyContentClassNameToBody && contentClassName,
						bodyClassName,
					)}
				>
					{isLoading ? <LoadingScreen /> : children}
				</div>

				{footer && !isLoading && (
					<DialogFooter
						className={cn("mt-2 border-t px-1 pt-4", footerClassNameProp)}
						{...restDialogFooterProps}
					>
						{footer}
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
};

function LoadingScreen() {
	return (
		<div className="flex flex-col items-center justify-center space-y-3">
			<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			<span className="text-sm font-medium text-muted-foreground">Loading...</span>
		</div>
	);
}

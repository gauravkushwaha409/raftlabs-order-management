"use client";

import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type * as React from "react";
import { Button } from "#components/base-ui/button";
import { cn } from "#lib/utils";

/**
 * Edge-anchored panel built on Radix Dialog, so it inherits the same focus
 * trap, scroll lock and Escape handling as Dialog without pulling in a
 * second overlay library.
 */

export type SheetSide = "right" | "left" | "top" | "bottom";
export type SheetSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

const SIDE_CLASSES: Record<SheetSide, string> = {
	right:
		"inset-y-0 right-0 h-full border-l data-open:slide-in-from-right data-closed:slide-out-to-right",
	left:
		"inset-y-0 left-0 h-full border-r data-open:slide-in-from-left data-closed:slide-out-to-left",
	top: "inset-x-0 top-0 w-full border-b data-open:slide-in-from-top data-closed:slide-out-to-top",
	bottom:
		"inset-x-0 bottom-0 w-full border-t data-open:slide-in-from-bottom data-closed:slide-out-to-bottom",
};

const HORIZONTAL_SIZE: Record<SheetSize, string> = {
	sm: "w-full sm:max-w-sm",
	md: "w-full sm:max-w-md",
	lg: "w-full sm:max-w-lg",
	xl: "w-full sm:max-w-xl",
	"2xl": "w-full sm:max-w-2xl",
	full: "w-full sm:max-w-[95vw]",
};

const VERTICAL_SIZE: Record<SheetSize, string> = {
	sm: "max-h-60",
	md: "max-h-80",
	lg: "max-h-96",
	xl: "max-h-[32rem]",
	"2xl": "max-h-[40rem]",
	full: "max-h-dvh",
};

function Sheet({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
	return <DialogPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
	return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
	return <DialogPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetContent({
	className,
	children,
	side = "right",
	size = "md",
	showCloseButton = true,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
	side?: SheetSide;
	size?: SheetSize;
	showCloseButton?: boolean;
}) {
	const isHorizontal = side === "left" || side === "right";

	return (
		<DialogPrimitive.Portal data-slot="sheet-portal">
			<DialogPrimitive.Overlay
				data-slot="sheet-overlay"
				className="fixed inset-0 isolate z-50 bg-black/10 duration-200 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
			/>
			<DialogPrimitive.Content
				data-slot="sheet-content"
				data-side={side}
				className={cn(
					"fixed z-50 flex flex-col bg-white-base border-gray-border-200 shadow-lg outline-none duration-200 data-open:animate-in data-closed:animate-out",
					SIDE_CLASSES[side],
					isHorizontal ? HORIZONTAL_SIZE[size] : VERTICAL_SIZE[size],
					className,
				)}
				{...props}
			>
				{children}
				{showCloseButton && (
					<DialogPrimitive.Close data-slot="sheet-close" asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							className="absolute top-3 right-3 w-auto"
						>
							<XIcon />
							<span className="sr-only">Close</span>
						</Button>
					</DialogPrimitive.Close>
				)}
			</DialogPrimitive.Content>
		</DialogPrimitive.Portal>
	);
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sheet-header"
			className={cn(
				"flex shrink-0 flex-col gap-1 border-b border-gray-border-200 px-4 py-3.5",
				className,
			)}
			{...props}
		/>
	);
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sheet-body"
			className={cn("min-h-0 flex-1 overflow-y-auto", className)}
			{...props}
		/>
	);
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sheet-footer"
			className={cn(
				"flex shrink-0 flex-col-reverse gap-2 border-t border-gray-border-200 px-4 py-3 sm:flex-row sm:justify-end",
				className,
			)}
			{...props}
		/>
	);
}

function SheetTitle({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			data-slot="sheet-title"
			className={cn("typo-t2 font-medium text-gray-950", className)}
			{...props}
		/>
	);
}

function SheetDescription({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description
			data-slot="sheet-description"
			className={cn("typo-t4 text-gray-500", className)}
			{...props}
		/>
	);
}

export {
	Sheet,
	SheetBody,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
};

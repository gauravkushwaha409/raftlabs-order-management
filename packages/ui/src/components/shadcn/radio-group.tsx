import { CheckIcon } from "lucide-react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "#lib/utils";

function RadioGroup({
	className,
	...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
	return (
		<RadioGroupPrimitive.Root
			data-slot="radio-group"
			className={cn("grid w-full gap-3", className)}
			{...props}
		/>
	);
}

function RadioGroupItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
	return (
		<RadioGroupPrimitive.Item
			data-slot="radio-group-item"
			className={cn(
				"group/radio-group-item peer relative flex aspect-square size-6 shrink-0 rounded-full border border-input outline-none after:absolute after:-inset-x-3 after:-inset-y-2 data-checked:border-primary data-checked:bg-primary data-checked:text-white-base disabled:bg-gray-200 disabled:border-gray-200",
				className,
			)}
			{...props}
		>
			<RadioGroupPrimitive.Indicator
				data-slot="radio-group-indicator"
				className="flex h-full w-full items-center justify-center"
			>
				<CheckIcon />
			</RadioGroupPrimitive.Indicator>
		</RadioGroupPrimitive.Item>
	);
}

function RadioGroupItemNative({
	children,
	className,
	...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
	return (
		<RadioGroupPrimitive.Item
			data-slot="radio-group-item-native"
			className={cn("peer", className)}
			{...props}
		>
			{children}
		</RadioGroupPrimitive.Item>
	);
}

export { RadioGroup, RadioGroupItem, RadioGroupItemNative };

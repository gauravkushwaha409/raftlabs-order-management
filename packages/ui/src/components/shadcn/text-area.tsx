import { cva, type VariantProps } from "class-variance-authority";
import type React from "react";
import { cn } from "#lib/utils";

const textareaVariants = cva(
	[
		"flex w-full min-w-0 gap-2 rounded-[6px] border border-gray-200 bg-transparent text-gray-500",
		"transition-[color,box-shadow]",
		"focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100",
	],
	{
		variants: {
			size: {
				default: "px-3 py-2 min-h-24.5",
				lg: "px-[14px] py-3 min-h-37.5",
			},
		},
		defaultVariants: {
			size: "default",
		},
	},
);

const textareaElementVariants = cva(
	[
		"w-full flex-1 resize-none border-0 bg-transparent font-medium shadow-none outline-none",
		"text-gray-950 placeholder:font-normal placeholder:text-gray-500",
		"disabled:pointer-events-none disabled:placeholder:text-gray-400",
	],
	{
		variants: {
			size: {
				default: "typo-t3",
				lg: "typo-t1",
			},
		},
		defaultVariants: {
			size: "default",
		},
	},
);

export interface TextareaProps
	extends Omit<React.ComponentProps<"textarea">, "size">,
		VariantProps<typeof textareaVariants> {
	leftIcon?: React.ReactNode;
}

function Textarea({ className, size, leftIcon, ...props }: TextareaProps) {
	const isDisabled = props.disabled;
	const isInvalid =
		props["aria-invalid"] === true || props["aria-invalid"] === "true";

	return (
		<div
			data-disabled={isDisabled ? "true" : undefined}
			data-invalid={isInvalid ? "true" : undefined}
			className={cn(
				textareaVariants({ size }),
				"data-[disabled=true]:pointer-events-none data-[disabled=true]:border-gray-200 data-[disabled=true]:bg-gray-50 data-[disabled=true]:text-gray-400",
				"data-[invalid=true]:border-alert-500 focus-within:data-[invalid=true]:ring-2 data-[invalid=true]:focus-within:ring-alert-100",
				className,
			)}
		>
			{leftIcon && <div className="mt-0.5 shrink-0">{leftIcon}</div>}

			<textarea
				data-slot="textarea"
				className={cn(textareaElementVariants({ size }))}
				{...props}
			/>
		</div>
	);
}

export { Textarea };

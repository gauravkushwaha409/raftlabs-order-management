import * as React from "react";
import { cn } from "#lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"flex h-10 w-full min-w-0 rounded-lg border border-gray-border-200 bg-white-base px-3.5 py-2 text-base shadow-sm transition-all outline-none",
				"file:inline-flex file:h-7 file:items-center file:rounded-md file:border-0 file:bg-primary-100 file:px-2.5 file:text-sm file:font-medium file:text-primary-500 file:transition-colors hover:file:bg-primary-200",
				"text-gray-950 placeholder:text-gray-500",
				"focus-visible:border-primary-500 focus-visible:ring-3 focus-visible:ring-primary-100",
				"disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-gray-border-200 disabled:bg-gray-50 disabled:text-gray-400",
				"aria-invalid:border-alert-500 aria-invalid:ring-3 aria-invalid:ring-alert-100",
				"md:text-sm",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };

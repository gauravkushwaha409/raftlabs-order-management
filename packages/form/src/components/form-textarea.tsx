import { cn, Label, Textarea, Typography } from "@package/ui";
import {
	type FieldValues,
	get,
	type RegisterOptions,
	useFormContext,
} from "react-hook-form";

interface FormTextareaProps {
	name: string;
	label?: string;
	hint?: string;
	placeholder?: string;
	required?: boolean;
	rows?: number;
	size?: "default" | "lg";
	registerOption?: RegisterOptions<FieldValues, string>;
	textareaProps?: React.ComponentProps<typeof Textarea>;
	wrapperProps?: React.ComponentProps<"div">;
	labelProps?: React.ComponentProps<typeof Label>;
}

export function FormTextarea({
	name,
	label,
	hint,
	placeholder,
	size = "default",
	required,
	rows = 4,
	registerOption,
	textareaProps,
	wrapperProps,
	labelProps,
}: FormTextareaProps) {
	const {
		register,
		formState: { errors },
	} = useFormContext();

	const error = get(errors, name);
	const { className: wrapperClassName, ...restWrapperProps } =
		wrapperProps ?? {};

	return (
		<div
			className={cn("flex flex-col gap-1.5", wrapperClassName)}
			{...restWrapperProps}
		>
			{(label || required) && (
				<div className="flex flex-row gap-1.5 items-center">
					{label && (
						<Label
							htmlFor={name}
							{...labelProps}
							className={cn("typo-t3 text-gray-600", labelProps?.className)}
						>
							{label}
						</Label>
					)}
					{required && <span>*</span>}
				</div>
			)}

			<Textarea
				id={name}
				placeholder={placeholder}
				rows={rows}
				aria-invalid={!!error}
				size={size}
				{...textareaProps}
				{...register(name, registerOption)}
			/>

			{hint && !error && (
				<div className="flex items-center gap-1.5">
					<Typography.T5 className="text-gray-500">{hint}</Typography.T5>
				</div>
			)}

			{error && (
				<div className="flex items-center gap-1.5">
					<Typography.T5 className="text-alert-500">
						{error.message as string}
					</Typography.T5>
				</div>
			)}
		</div>
	);
}

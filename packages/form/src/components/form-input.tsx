import { cn, Input, Label, Typography } from "@package/ui";
import { AlertCircleIcon, type LucideIcon } from "lucide-react";
import {
	type FieldValues,
	get,
	type RegisterOptions,
	useFormContext,
} from "react-hook-form";

interface FormInputProps {
	name: string;
	label?: string;
	hint?: string;
	placeholder?: string;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
	hintIcon?: LucideIcon;
	size?: "default" | "lg";
	required?: boolean;
	registerOption?: RegisterOptions<FieldValues, string> | undefined;
	inputProps?: React.ComponentProps<typeof Input>;
	wrapperProps?: React.ComponentProps<"div">;
	labelProps?: React.ComponentProps<typeof Label>;
	disabled?: boolean;
	hintIconClassName?: string;
}

export function FormInput({
	name,
	label,
	hint,
	leftIcon,
	rightIcon,
	hintIcon: HintIcon = AlertCircleIcon,
	size = "default",
	required,
	placeholder,
	registerOption,
	inputProps,
	disabled = false,
	wrapperProps,
	labelProps,
	hintIconClassName,
}: FormInputProps) {
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
			<div className="flex flex-row gap-1.5">
				{label && (
					<Label htmlFor={name} {...labelProps} className="typo-t3 text-gray-600">
						{label}
					</Label>
				)}
				{required && <p>*</p>}
			</div>

			<Input
				aria-invalid={error && true}
				size={size}
				placeholder={placeholder}
				id={name}
				leftIcon={leftIcon}
				rightIcon={rightIcon}
				disabled={disabled}
				{...register(name, registerOption)}
				{...inputProps}
			/>

			{hint && !error && (
				<div className="flex items-center gap-1.5">
					<HintIcon size={14} className={cn("text-gray-400", hintIconClassName)} />
					<Typography.T5 className="text-gray-500">{hint}</Typography.T5>
				</div>
			)}
			{error && (
				<div className="flex items-center gap-1.5">
					<AlertCircleIcon
						size={14}
						className={cn("text-gray-400", error && "text-alert-500")}
					/>
					<Typography.T5 className="text-alert-500">
						{error.message as string}
					</Typography.T5>
				</div>
			)}
		</div>
	);
}

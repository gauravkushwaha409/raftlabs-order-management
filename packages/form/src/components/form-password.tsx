import { cn, Label, Typography } from "@package/ui";
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import {
	type FieldValues,
	get,
	type RegisterOptions,
	useFormContext,
} from "react-hook-form";

interface FormPasswordProps {
	name: string;
	label?: string;
	hint?: string;
	placeholder?: string;
	size?: "default" | "lg";
	required?: boolean;
	registerOption?: RegisterOptions<FieldValues, string> | undefined;
	inputProps?: React.ComponentProps<"input">;
	wrapperProps?: React.ComponentProps<"div">;
	labelProps?: React.ComponentProps<typeof Label>;
}

export function FormPassword({
	name,
	label,
	hint,
	registerOption,
	inputProps,
	required,
	size,
	placeholder,
	wrapperProps,
	labelProps,
}: FormPasswordProps) {
	const [showPassword, setShowPassword] = useState(false);
	const {
		register,
		formState: { errors },
	} = useFormContext();
	const error = get(errors, name);
	const { className: wrapperClassName, ...restWrapperProps } =
		wrapperProps ?? {};

	const sizeClasses = {
		default: "h-10 text-sm",
		lg: "h-12 text-base",
	};

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

			<div className="relative">
				<input
					id={name}
					type={showPassword ? "text" : "password"}
					placeholder={placeholder}
					aria-invalid={error && true}
					className={cn(
						"flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 pr-10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50",
						size && sizeClasses[size],
						error && "border-red-500 focus:ring-red-500 focus:border-red-500",
						inputProps?.className,
					)}
					{...register(name, registerOption)}
					{...inputProps}
				/>
				<button
					type="button"
					tabIndex={-1}
					onClick={() => setShowPassword(!showPassword)}
					className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
				>
					{showPassword ? <EyeIcon size={16} /> : <EyeOffIcon size={16} />}
				</button>
			</div>

			{hint && !error && (
				<div className="flex items-center gap-1.5">
					<AlertCircleIcon size={14} className="text-gray-400" />
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

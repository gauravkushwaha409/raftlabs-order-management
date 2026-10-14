import { cn } from "@package/ui";
import { type FieldValues, type Path, useFormContext } from "react-hook-form";

interface FormCheckboxProps<T extends FieldValues> {
	name: Path<T>;
	label?: string;
	wrapperProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function FormCheckbox<T extends FieldValues>({
	name,
	label,
	wrapperProps,
}: FormCheckboxProps<T>) {
	const { register } = useFormContext<T>();
	const { className: wrapperClassName, ...restWrapperProps } =
		wrapperProps || {};

	return (
		<div
			className={cn("flex items-center gap-2", wrapperClassName)}
			{...restWrapperProps}
		>
			<input
				id={name}
				type="checkbox"
				className="size-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
				{...register(name)}
			/>
			{label && (
				<label htmlFor={name} className="text-sm text-gray-700 cursor-pointer">
					{label}
				</label>
			)}
		</div>
	);
}

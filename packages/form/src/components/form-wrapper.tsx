import { type ReactNode } from "react";
import {
	type FieldValues,
	FormProvider,
	type UseFormReturn,
} from "react-hook-form";

interface FormWrapperProps<T extends FieldValues> {
	children: ReactNode;
	useFormMethods: UseFormReturn<T>;
	formProps?: Pick<React.ComponentProps<"form">, "className" | "onSubmit">;
}

export const FormWrapper = <T extends FieldValues>({
	children,
	useFormMethods,
	formProps,
}: FormWrapperProps<T>) => {
	const { onSubmit, ...restFormProps } = formProps ?? {};

	return (
		<FormProvider {...useFormMethods}>
			<form onSubmit={onSubmit} {...restFormProps}>
				{children}
			</form>
		</FormProvider>
	);
};

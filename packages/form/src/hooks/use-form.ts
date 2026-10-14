import { zodResolver } from "@hookform/resolvers/zod";
import {
	type FieldValues,
	type UseFormProps,
	useForm as useReactHookForm,
} from "react-hook-form";
import type { z } from "zod";

interface UseAppFormProps<T extends FieldValues> extends UseFormProps<T> {
	schema?: z.ZodType<any, any, any>;
}

export function useForm<T extends FieldValues>({
	schema,
	...props
}: UseAppFormProps<T>) {
	return useReactHookForm<T>({
		mode: "onTouched",
		reValidateMode: "onChange",
		...props,
		resolver: schema ? zodResolver(schema) : undefined,
	});
}

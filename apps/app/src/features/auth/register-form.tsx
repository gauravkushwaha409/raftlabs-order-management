import { FormInput, FormPassword, FormWrapper, useForm } from "@package/form";
import { Button } from "@package/ui";
import { type RegisterValues, registerSchema } from "./auth-schema";

interface RegisterFormProps {
	onSubmit: (values: RegisterValues) => void;
	isPending?: boolean;
	error?: string | null;
}

export function RegisterForm({
	onSubmit,
	isPending = false,
	error,
}: RegisterFormProps) {
	const form = useForm<RegisterValues>({
		schema: registerSchema,
		defaultValues: { name: "", email: "", password: "" },
	});

	return (
		<FormWrapper
			useFormMethods={form}
			formProps={{
				className: "flex flex-col gap-4",
				onSubmit: form.handleSubmit(onSubmit),
			}}
		>
			<FormInput
				name="name"
				label="Full name"
				placeholder="Ada Lovelace"
				size="lg"
				inputProps={{ autoComplete: "name" }}
			/>
			<FormInput
				name="email"
				label="Email"
				placeholder="you@example.com"
				size="lg"
				inputProps={{ type: "email", autoComplete: "email" }}
			/>
			<FormPassword
				name="password"
				label="Password"
				hint="At least 8 characters"
				size="lg"
				inputProps={{ autoComplete: "new-password" }}
			/>
			{error && (
				<p role="alert" className="typo-t3 text-alert-500">
					{error}
				</p>
			)}
			<Button
				type="submit"
				size="lg"
				isPending={isPending}
				pendingText="Creating account…"
			>
				Create account
			</Button>
		</FormWrapper>
	);
}

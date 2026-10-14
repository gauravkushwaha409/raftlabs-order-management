import { FormInput, FormPassword, FormWrapper, useForm } from "@package/form";
import { Button } from "@package/ui";
import { type LoginValues, loginSchema } from "./auth-schema";

interface LoginFormProps {
	onSubmit: (values: LoginValues) => void;
	isPending?: boolean;
	error?: string | null;
}

export function LoginForm({
	onSubmit,
	isPending = false,
	error,
}: LoginFormProps) {
	const form = useForm<LoginValues>({
		schema: loginSchema,
		defaultValues: { email: "", password: "" },
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
				name="email"
				label="Email"
				placeholder="you@example.com"
				size="lg"
				inputProps={{ type: "email", autoComplete: "email" }}
			/>
			<FormPassword
				name="password"
				label="Password"
				size="lg"
				inputProps={{ autoComplete: "current-password" }}
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
				pendingText="Signing in…"
			>
				Sign in
			</Button>
		</FormWrapper>
	);
}

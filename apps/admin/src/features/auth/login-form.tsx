import { FormInput, FormPassword, FormWrapper, useForm } from "@package/form";
import { Button } from "@package/ui";
import { z } from "zod";

const loginSchema = z.object({
	email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
	password: z.string().min(1, "Enter your password"),
});

type LoginValues = z.infer<typeof loginSchema>;

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
		<div className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-xl border border-gray-border-200 p-6">
			<h2 className="typo-h5 text-gray-800">Admin sign in</h2>
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
					size="lg"
					inputProps={{ type: "email", autoComplete: "username" }}
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
				<Button type="submit" isPending={isPending} pendingText="Signing in…">
					Sign in
				</Button>
			</FormWrapper>
		</div>
	);
}

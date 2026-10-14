import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { useLogin, useRegister } from "./session";

function AuthCard({
	title,
	children,
	footer,
}: {
	title: string;
	children: ReactNode;
	footer: ReactNode;
}) {
	return (
		<div className="mx-auto flex max-w-md flex-col gap-6 rounded-xl border border-gray-border-200 p-6">
			<h2 className="typo-h4 text-gray-800">{title}</h2>
			{children}
			<p className="typo-t3 text-center text-gray-600">{footer}</p>
		</div>
	);
}

export function LoginPage({ redirect }: { redirect: string | undefined }) {
	const login = useLogin(redirect);
	return (
		<AuthCard
			title="Sign in"
			footer={
				<>
					New here?{" "}
					<Link
						to="/register"
						search={{ redirect }}
						className="text-primary-500 hover:underline"
					>
						Create an account
					</Link>
				</>
			}
		>
			<LoginForm
				isPending={login.isPending}
				error={login.error?.message ?? null}
				onSubmit={(values) => login.mutate(values)}
			/>
		</AuthCard>
	);
}

export function RegisterPage({ redirect }: { redirect: string | undefined }) {
	const register = useRegister(redirect);
	return (
		<AuthCard
			title="Create your account"
			footer={
				<>
					Already registered?{" "}
					<Link
						to="/login"
						search={{ redirect }}
						className="text-primary-500 hover:underline"
					>
						Sign in
					</Link>
				</>
			}
		>
			<RegisterForm
				isPending={register.isPending}
				error={register.error?.message ?? null}
				onSubmit={(values) => register.mutate(values)}
			/>
		</AuthCard>
	);
}

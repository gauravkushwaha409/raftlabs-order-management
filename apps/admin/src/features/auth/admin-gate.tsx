import type { ReactNode } from "react";
import type { User } from "@/types/api";
import { LoginForm } from "./login-form";
import { useAdmin, useLogin } from "./session";

/** Renders the children for a signed-in admin and the sign-in form for everyone else. */
export function AdminGate({
	children,
}: {
	children: (admin: User) => ReactNode;
}) {
	const admin = useAdmin();
	const login = useLogin();

	if (admin.isPending)
		return (
			<div
				role="status"
				aria-label="Loading"
				className="h-48 animate-pulse rounded-xl bg-gray-100"
			/>
		);
	if (admin.data) return <>{children(admin.data)}</>;

	return (
		<LoginForm
			isPending={login.isPending}
			error={login.error?.message ?? null}
			onSubmit={(values) => login.mutate(values)}
		/>
	);
}

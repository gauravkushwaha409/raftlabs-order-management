import { useMutation } from "@package/query";
import type { ReactNode } from "react";
import { listOrders } from "@/lib/api";
import { useAdminKey } from "./admin-key";
import { LoginForm } from "./login-form";

/** Shows the children once an admin key is stored; otherwise verifies a typed key against the API first. */
export function AdminGate({
	children,
}: {
	children: (adminKey: string) => ReactNode;
}) {
	const { adminKey, signIn } = useAdminKey();
	const verify = useMutation((key: string) => listOrders(key).then(() => key), {
		onSuccess: signIn,
	});

	if (adminKey) return <>{children(adminKey)}</>;

	return (
		<LoginForm
			isPending={verify.isPending}
			error={verify.error?.message ?? null}
			onSubmit={(key) => verify.mutate(key)}
		/>
	);
}

import { createFileRoute } from "@tanstack/react-router";
import { RegisterPage } from "@/features/auth/auth-pages";
import { redirectIfSignedIn } from "@/features/auth/session";

export const Route = createFileRoute("/register")({
	validateSearch: (search: Record<string, unknown>) => ({
		redirect: typeof search.redirect === "string" ? search.redirect : undefined,
	}),
	beforeLoad: redirectIfSignedIn,
	component: RegisterRoute,
});

function RegisterRoute() {
	const { redirect } = Route.useSearch();
	return <RegisterPage redirect={redirect} />;
}

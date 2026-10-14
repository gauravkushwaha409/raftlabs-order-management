import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/features/auth/auth-pages";
import { redirectIfSignedIn } from "@/features/auth/session";

export const Route = createFileRoute("/login")({
	validateSearch: (search: Record<string, unknown>) => ({
		redirect: typeof search.redirect === "string" ? search.redirect : undefined,
	}),
	beforeLoad: redirectIfSignedIn,
	component: LoginRoute,
});

function LoginRoute() {
	const { redirect } = Route.useSearch();
	return <LoginPage redirect={redirect} />;
}

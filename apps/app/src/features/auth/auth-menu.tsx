import { Button, buttonVariants, cn } from "@package/ui";
import { Link } from "@tanstack/react-router";
import { useLogout, useMe } from "./session";

export function AuthMenu() {
	const me = useMe();
	const logout = useLogout();

	if (!me.data) {
		return (
			<Link
				to="/login"
				search={{ redirect: undefined }}
				className={cn(
					buttonVariants({ variant: "secondary", size: "sm" }),
					"w-auto",
				)}
			>
				Sign in
			</Link>
		);
	}

	return (
		<div className="flex items-center gap-3">
			<span className="typo-t4 hidden text-gray-600 sm:inline">
				Hi, {me.data.name}
			</span>
			<Link to="/orders" className="typo-t3 text-gray-700 hover:text-primary-500">
				My orders
			</Link>
			<Button
				variant="ghost"
				size="sm"
				className="w-auto"
				isPending={logout.isPending}
				onClick={() => logout.mutate()}
			>
				Sign out
			</Button>
		</div>
	);
}

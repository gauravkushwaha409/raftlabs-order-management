import { createFileRoute } from "@tanstack/react-router";
import { AdminGate } from "@/features/auth/admin-gate";

export const Route = createFileRoute("/settings")({
	component: () => (
		<AdminGate>
			{() => (
				<div className="flex flex-col gap-2">
					<h2 className="typo-h4 text-gray-800">Settings</h2>
					<p className="typo-t3 text-gray-500">
						Admin settings will live here.
					</p>
				</div>
			)}
		</AdminGate>
	),
});

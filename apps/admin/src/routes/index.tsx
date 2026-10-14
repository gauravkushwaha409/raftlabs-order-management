import { createFileRoute } from "@tanstack/react-router";
import { AdminGate } from "@/features/auth/admin-gate";
import { OrdersPage } from "@/features/orders/orders-page";

export const Route = createFileRoute("/")({
	component: () => (
		<AdminGate>{(adminKey) => <OrdersPage adminKey={adminKey} />}</AdminGate>
	),
});

import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/features/auth/session";
import { OrdersListPage } from "@/features/orders/orders-list-page";

export const Route = createFileRoute("/orders/")({
	beforeLoad: requireAuth,
	component: OrdersListPage,
});

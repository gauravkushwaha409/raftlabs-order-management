import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/features/auth/session";
import { OrderPage } from "@/features/orders/order-page";

export const Route = createFileRoute("/orders/$orderId")({
	beforeLoad: requireAuth,
	component: OrderRoute,
});

function OrderRoute() {
	const { orderId } = Route.useParams();
	return <OrderPage orderId={orderId} />;
}

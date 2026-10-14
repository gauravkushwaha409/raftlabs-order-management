import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/features/auth/session";
import { CheckoutPage } from "@/features/checkout/checkout-page";

export const Route = createFileRoute("/checkout")({
	beforeLoad: requireAuth,
	component: CheckoutPage,
});

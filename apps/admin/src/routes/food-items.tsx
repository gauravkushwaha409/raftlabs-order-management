import { createFileRoute } from "@tanstack/react-router";
import { AdminGate } from "@/features/auth/admin-gate";
import { FoodItemsPage } from "@/features/food-items/food-items-page";

export const Route = createFileRoute("/food-items")({
	component: () => <AdminGate>{() => <FoodItemsPage />}</AdminGate>,
});

import { createFileRoute } from "@tanstack/react-router";
import { MenuDetailsPage } from "@/features/menu/menu-details-page";

export const Route = createFileRoute("/menu/$itemId")({
	component: MenuItemRoute,
});

function MenuItemRoute() {
	const { itemId } = Route.useParams();
	return <MenuDetailsPage itemId={itemId} />;
}

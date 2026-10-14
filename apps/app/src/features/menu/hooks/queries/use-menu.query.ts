import { ApiError } from "@package/api-client";
import { useQuery } from "@package/query";
import { QUERY_KEYS } from "@/config/query-keys";
import type { MenuItem } from "@/types/api";
import { menuApiService } from "../../services/menu-api.service";

export const useMenuQuery = () =>
	useQuery<MenuItem[], ApiError, MenuItem[]>([...QUERY_KEYS.MENU.ALL], () =>
		menuApiService.listMenu().then((response) => response.data.data),
	);

import { BaseApiService } from "@package/api-client";
import { ENDPOINTS } from "@/config/endpoints";
import { apiClient } from "@/lib/api-client";
import type { MenuItem } from "@/types/api";
import type { MenuTypes } from "../types/menu-api.types";

class MenuApiService extends BaseApiService {
	async listMenu(): Promise<MenuTypes.ListResponse> {
		return super.get<MenuItem[]>(ENDPOINTS.MENU.LIST);
	}
}

export const menuApiService = new MenuApiService(apiClient);

import { BaseApiService } from "@package/api-client";
import { ENDPOINTS } from "@/config/endpoints";
import { apiClient } from "@/lib/api-client";
import type { MenuItem } from "@/types/api";
import type { MenuTypes } from "../types/menu-api.types";

class MenuApiService extends BaseApiService {
	async listMenuItems(): Promise<MenuTypes.ListResponse> {
		return super.get<MenuItem[]>(ENDPOINTS.MENU.ALL);
	}

	async createMenuItem(
		input: MenuTypes.CreatePayload,
	): Promise<MenuTypes.SaveResponse> {
		return super.post<MenuItem>(ENDPOINTS.MENU.CREATE, input);
	}

	async updateMenuItem(
		itemId: string,
		input: MenuTypes.UpdatePayload,
	): Promise<MenuTypes.SaveResponse> {
		return super.patch<MenuItem>(ENDPOINTS.MENU.DETAIL(itemId), input);
	}

	async deleteMenuItem(itemId: string): Promise<void> {
		await super.delete(ENDPOINTS.MENU.DETAIL(itemId));
	}
}

export const menuApiService = new MenuApiService(apiClient);

import type { ApiResponse } from "@package/api-client";
import type { MenuItem, MenuItemInput } from "@/types/api";

export namespace MenuTypes {
	export type CreatePayload = MenuItemInput;
	export type UpdatePayload = Partial<MenuItemInput>;

	export interface SavePayload {
		item: MenuItem | null;
		input: MenuItemInput;
	}

	/** Wire shape of GET /menu/all. Unwrap with `response.data.data`. */
	export type ListResponse = ApiResponse<MenuItem[]>;

	/** Wire shape of POST /menu and PATCH /menu/:id. Unwrap with `response.data.data`. */
	export type SaveResponse = ApiResponse<MenuItem>;
}

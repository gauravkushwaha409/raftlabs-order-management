import type { ApiResponse } from "@package/api-client";
import type { MenuItem } from "@/types/api";

export namespace MenuTypes {
	/** Wire shape of GET /menu. Unwrap with `response.data.data`. */
	export type ListResponse = ApiResponse<MenuItem[]>;
}

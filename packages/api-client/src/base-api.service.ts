import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import type { ApiResponse } from "./types.js";

export class BaseApiService {
	protected api: AxiosInstance;

	constructor(apiInstance: AxiosInstance) {
		this.api = apiInstance;
	}

	/**
	 * TResponseData: the payload shape inside the envelope's `data`.
	 * TBody: the request payload shape.
	 */
	async get<
		TResponseData,
		TAxiosResponse extends
			ApiResponse<TResponseData> = ApiResponse<TResponseData>,
	>(url: string, config?: AxiosRequestConfig) {
		return this.api.get<TResponseData, TAxiosResponse>(url, config);
	}

	async post<
		TResponseData,
		TAxiosResponse extends
			ApiResponse<TResponseData> = ApiResponse<TResponseData>,
		TPayload = unknown,
	>(url: string, data?: TPayload, config?: AxiosRequestConfig) {
		return this.api.post<TResponseData, TAxiosResponse, TPayload>(
			url,
			data,
			config,
		);
	}

	async patch<TResponseData, TPayload = unknown>(
		url: string,
		data?: TPayload,
		config?: AxiosRequestConfig,
	): Promise<ApiResponse<TResponseData>> {
		return this.api.patch<TResponseData, ApiResponse<TResponseData>, TPayload>(
			url,
			data,
			config,
		);
	}

	async put<TResponseData, TPayload = unknown>(
		url: string,
		data?: TPayload,
		config?: AxiosRequestConfig,
	): Promise<ApiResponse<TResponseData>> {
		return this.api.put<TResponseData, ApiResponse<TResponseData>, TPayload>(
			url,
			data,
			config,
		);
	}

	async delete<TResponseData = void>(
		url: string,
		config?: AxiosRequestConfig,
	): Promise<AxiosResponse<TResponseData>> {
		return this.api.delete<TResponseData>(url, config);
	}
}

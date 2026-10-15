import { BaseApiService } from "@package/api-client";
import { ENDPOINTS } from "@/config/endpoints";
import { apiClient } from "@/lib/api-client";
import type { NotificationFeed } from "@/types/api";

class NotificationsApiService extends BaseApiService {
	async getFeed() {
		return super.get<NotificationFeed>(ENDPOINTS.NOTIFICATIONS.LIST);
	}

	async markRead(notificationId: string) {
		return super.patch<void>(ENDPOINTS.NOTIFICATIONS.READ(notificationId));
	}

	async markAllRead() {
		return super.post<void>(ENDPOINTS.NOTIFICATIONS.READ_ALL);
	}
}

export const notificationsApiService = new NotificationsApiService(apiClient);

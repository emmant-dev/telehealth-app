import { apiClient } from "./client";
import type { ApiEnvelope, Notification } from "../types";

export const notificationApi = {
  async listMine(): Promise<Notification[]> {
    const response = await apiClient.get<ApiEnvelope<{ notifications: Notification[] }>>(
      "/api/notifications"
    );
    return response.data.data.notifications;
  },

  async updateReadState(id: string, read: boolean): Promise<Notification> {
    const response = await apiClient.patch<ApiEnvelope<{ notification: Notification }>>(
      `/api/notifications/${id}`,
      { read }
    );
    return response.data.data.notification;
  }
};

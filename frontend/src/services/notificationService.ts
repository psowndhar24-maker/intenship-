import { api } from './api';
import { Notification } from '../types/internship';

export class NotificationService {
  /**
   * Fetch in-app notifications for authenticated user
   */
  public static async getNotifications(
    unreadOnly: boolean = false,
    limit: number = 30
  ): Promise<{ success: boolean; data: Notification[]; count: number }> {
    const params = new URLSearchParams();
    if (unreadOnly) params.append('unread_only', 'true');
    if (limit) params.append('limit', String(limit));

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return api.get<{ success: boolean; data: Notification[]; count: number }>(
      `/notifications${queryString}`
    );
  }

  /**
   * Fetch unread notifications count
   */
  public static async getUnreadCount(): Promise<{ success: boolean; count: number }> {
    return api.get<{ success: boolean; count: number }>('/notifications/unread-count');
  }

  /**
   * Mark an individual notification as read
   */
  public static async markAsRead(id: string): Promise<{ success: boolean; message: string }> {
    return api.patch<{ success: boolean; message: string }>(`/notifications/${id}/read`);
  }

  /**
   * Mark all unread notifications as read
   */
  public static async markAllAsRead(): Promise<{ success: boolean; message: string }> {
    return api.patch<{ success: boolean; message: string }>('/notifications/read-all');
  }

  /**
   * Delete a notification
   */
  public static async deleteNotification(id: string): Promise<{ success: boolean; message: string }> {
    return api.delete<{ success: boolean; message: string }>(`/notifications/${id}`);
  }
}

import { query } from '../db/index.js';
import { Notification } from '../types/index.js';

export interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export interface GetNotificationsOptions {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}

export class NotificationService {
  /**
   * Create an in-app notification for a user and log the action.
   */
  public static async createNotification(params: CreateNotificationParams): Promise<Notification> {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    const insertSql = `
      INSERT INTO notifications (
        id, user_id, type, title, message, related_entity_type, related_entity_id, is_read
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
      RETURNING *
    `;

    const result = await query<Notification>(insertSql, [
      id,
      params.userId,
      params.type,
      params.title.trim(),
      params.message.trim(),
      params.relatedEntityType || null,
      params.relatedEntityId || null,
    ]);

    // Record audit log for notification generation
    try {
      const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await query(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          auditId,
          params.userId,
          'NOTIFICATION_CREATED',
          'NOTIFICATION',
          id,
          JSON.stringify({
            type: params.type,
            title: params.title,
            related_entity_type: params.relatedEntityType || null,
            related_entity_id: params.relatedEntityId || null,
          }),
        ]
      );
    } catch (auditErr) {
      console.warn('Notice: Audit log failed for notification creation:', auditErr);
    }

    return result.rows[0];
  }

  /**
   * Fetch paginated notifications for the authenticated user.
   */
  public static async getUserNotifications(
    userId: string,
    options?: GetNotificationsOptions
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const limit = Math.max(1, Math.min(100, Number(options?.limit) || 20));
    const offset = Math.max(0, Number(options?.offset) || 0);
    const unreadOnly = Boolean(options?.unreadOnly);

    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];

    if (unreadOnly) {
      whereClause += ' AND is_read = FALSE';
    }

    const countSql = `SELECT COUNT(*)::int as total FROM notifications ${whereClause}`;
    const countRes = await query<{ total: number }>(countSql, params);
    const total = Number(countRes.rows[0]?.total || 0);

    const unreadSql = `SELECT COUNT(*)::int as unread FROM notifications WHERE user_id = $1 AND is_read = FALSE`;
    const unreadRes = await query<{ unread: number }>(unreadSql, [userId]);
    const unreadCount = Number(unreadRes.rows[0]?.unread || 0);

    const dataSql = `
      SELECT * FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const dataRes = await query<Notification>(dataSql, [...params, limit, offset]);

    return {
      notifications: dataRes.rows,
      total,
      unreadCount,
    };
  }

  /**
   * Retrieve current unread notifications count for badge indicator.
   */
  public static async getUnreadCount(userId: string): Promise<number> {
    const sql = `SELECT COUNT(*)::int as count FROM notifications WHERE user_id = $1 AND is_read = FALSE`;
    const res = await query<{ count: number }>(sql, [userId]);
    return Number(res.rows[0]?.count || 0);
  }

  /**
   * Mark a single notification as read, validating ownership.
   */
  public static async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const sql = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const res = await query<Notification>(sql, [notificationId, userId]);

    if (res.rows.length === 0) {
      const error: any = new Error('Notification not found or unauthorized.');
      error.status = 404;
      error.code = 'NOTIFICATION_NOT_FOUND';
      throw error;
    }

    return res.rows[0];
  }

  /**
   * Mark all unread notifications as read for the authenticated user.
   */
  public static async markAllAsRead(userId: string): Promise<{ count: number }> {
    const sql = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1 AND is_read = FALSE
    `;

    const res = await query(sql, [userId]);
    return { count: res.rowCount || 0 };
  }
}

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { NotificationService } from '../services/notification.service.js';

export class NotificationController {
  public static getNotifications = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0;
      const unreadOnly = req.query.unreadOnly === 'true';

      const result = await NotificationService.getUserNotifications(userId, {
        limit,
        offset,
        unreadOnly,
      });

      res.status(200).json({
        success: true,
        data: result.notifications,
        pagination: {
          total: result.total,
          limit,
          offset,
          unreadCount: result.unreadCount,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public static getUnreadCount = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const count = await NotificationService.getUnreadCount(userId);
      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (err) {
      next(err);
    }
  };

  public static markAsRead = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.sub;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const updated = await NotificationService.markAsRead(userId, id);
      res.status(200).json({
        success: true,
        message: 'Notification marked as read.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  };

  public static markAllAsRead = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const result = await NotificationService.markAllAsRead(userId);
      res.status(200).json({
        success: true,
        message: 'All notifications marked as read.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}

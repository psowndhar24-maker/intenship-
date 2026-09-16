import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';

const router = Router();

// Authentication required for all notification operations
router.use(authenticateJwt);

router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.put('/read-all', NotificationController.markAllAsRead);
router.put('/:id/read', NotificationController.markAsRead);

export default router;

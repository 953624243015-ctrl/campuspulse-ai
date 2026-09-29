import { Router } from 'express';
import {
  getNotifications, markAsRead, markAllAsRead,
  getAnnouncements, getEmergencyAlerts,
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getNotifications);
router.patch('/:id/read', authenticate, markAsRead);
router.patch('/read-all', authenticate, markAllAsRead);
router.get('/announcements', authenticate, getAnnouncements);
router.get('/emergency-alerts', authenticate, getEmergencyAlerts);

export default router;

import { Router } from 'express';
import {
  getEvents, createEvent, registerForEvent, markQRAttendance,
  submitEventFeedback, getEventById,
} from '../controllers/eventController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getEvents);
router.post('/', authenticate, authorize('admin', 'faculty', 'hod', 'principal'), createEvent);
router.get('/:id', authenticate, getEventById);
router.post('/:id/register', authenticate, registerForEvent);
router.post('/:id/attendance/qr', authenticate, authorize('admin', 'faculty', 'hod'), markQRAttendance);
router.post('/:id/feedback', authenticate, submitEventFeedback);

export default router;

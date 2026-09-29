import { Router } from 'express';
import {
  submitComplaint, getComplaints, getComplaintById,
  updateComplaintStatus, getComplaintAnalytics,
} from '../controllers/complaintController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, submitComplaint);
router.get('/', authenticate, getComplaints);
router.get('/analytics/summary', authenticate, authorize('admin', 'hod', 'principal'), getComplaintAnalytics);
router.get('/:id', authenticate, getComplaintById);
router.patch('/:id/status', authenticate, authorize('admin', 'hod', 'principal', 'faculty'), updateComplaintStatus);

export default router;

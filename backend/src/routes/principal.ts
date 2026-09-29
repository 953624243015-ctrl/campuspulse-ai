import { Router } from 'express';
import {
  getPrincipalDashboard, getCampusAnalytics,
  runWhatIfSimulation, acknowledgeInsight,
} from '../controllers/principalController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

const principals = authorize('principal', 'admin');

router.get('/dashboard', authenticate, principals, getPrincipalDashboard);
router.get('/analytics/campus', authenticate, principals, getCampusAnalytics);
router.post('/what-if', authenticate, principals, runWhatIfSimulation);
router.patch('/insights/:id/acknowledge', authenticate, principals, acknowledgeInsight);

export default router;

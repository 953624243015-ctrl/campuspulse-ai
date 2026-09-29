import { Router } from 'express';
import {
  getHODDashboard, getDepartmentStudentAnalytics,
  getFacultyWorkload, getDepartmentSkillGap,
} from '../controllers/hodController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

const hodUp = authorize('hod', 'admin', 'principal');

router.get('/dashboard', authenticate, hodUp, getHODDashboard);
router.get('/students/analytics', authenticate, hodUp, getDepartmentStudentAnalytics);
router.get('/faculty/workload', authenticate, hodUp, getFacultyWorkload);
router.get('/skill-gap', authenticate, hodUp, getDepartmentSkillGap);

export default router;

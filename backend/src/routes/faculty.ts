import { Router } from 'express';
import {
  getFacultyDashboard, getMyStudents, createAttendanceSession,
  markAttendance, getMyMentees, createMentoringSession, createAssignment,
  getAtRiskStudents, acknowledgeRiskAlert, getWorkloadAnalytics,
} from '../controllers/facultyController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

const staff = authorize('faculty', 'mentor', 'hod', 'admin', 'principal');

router.get('/me/dashboard', authenticate, authorize('faculty', 'hod'), getFacultyDashboard);
router.get('/me/students', authenticate, staff, getMyStudents);
router.get('/me/mentees', authenticate, staff, getMyMentees);
router.get('/me/at-risk-students', authenticate, staff, getAtRiskStudents);
router.get('/me/workload', authenticate, staff, getWorkloadAnalytics);

router.post('/attendance/session', authenticate, staff, createAttendanceSession);
router.post('/attendance/mark', authenticate, staff, markAttendance);

router.post('/mentoring/session', authenticate, staff, createMentoringSession);
router.post('/assignments', authenticate, staff, createAssignment);

router.patch('/risk-alerts/:alertId/acknowledge', authenticate, staff, acknowledgeRiskAlert);

export default router;

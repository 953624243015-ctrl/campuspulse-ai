import { Router } from 'express';
import {
  getMyProfile, getMyAttendance, getMyMarks, getMyAssignments,
  getMyTimetable, getMySkills, getMyDashboard, listStudents,
  getStudentDigitalTwin,
} from '../controllers/studentController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Student self-service routes
router.get('/me/dashboard', authenticate, authorize('student'), getMyDashboard);
router.get('/me/profile', authenticate, authorize('student'), getMyProfile);
router.get('/me/attendance', authenticate, authorize('student'), getMyAttendance);
router.get('/me/marks', authenticate, authorize('student'), getMyMarks);
router.get('/me/assignments', authenticate, authorize('student'), getMyAssignments);
router.get('/me/timetable', authenticate, authorize('student'), getMyTimetable);
router.get('/me/skills', authenticate, authorize('student'), getMySkills);

// Staff routes
router.get('/', authenticate, authorize('faculty', 'mentor', 'hod', 'admin', 'principal'), listStudents);
router.get('/:studentId/digital-twin',
  authenticate, authorize('faculty', 'mentor', 'hod', 'admin', 'principal', 'student'),
  getStudentDigitalTwin
);

export default router;

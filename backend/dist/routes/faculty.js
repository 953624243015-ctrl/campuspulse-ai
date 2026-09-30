"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const facultyController_1 = require("../controllers/facultyController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const staff = (0, auth_1.authorize)('faculty', 'mentor', 'hod', 'admin', 'principal');
router.get('/me/dashboard', auth_1.authenticate, (0, auth_1.authorize)('faculty', 'hod'), facultyController_1.getFacultyDashboard);
router.get('/me/students', auth_1.authenticate, staff, facultyController_1.getMyStudents);
router.get('/me/mentees', auth_1.authenticate, staff, facultyController_1.getMyMentees);
router.get('/me/at-risk-students', auth_1.authenticate, staff, facultyController_1.getAtRiskStudents);
router.get('/me/workload', auth_1.authenticate, staff, facultyController_1.getWorkloadAnalytics);
router.post('/attendance/session', auth_1.authenticate, staff, facultyController_1.createAttendanceSession);
router.post('/attendance/mark', auth_1.authenticate, staff, facultyController_1.markAttendance);
router.post('/mentoring/session', auth_1.authenticate, staff, facultyController_1.createMentoringSession);
router.post('/assignments', auth_1.authenticate, staff, facultyController_1.createAssignment);
router.patch('/risk-alerts/:alertId/acknowledge', auth_1.authenticate, staff, facultyController_1.acknowledgeRiskAlert);
exports.default = router;
//# sourceMappingURL=faculty.js.map
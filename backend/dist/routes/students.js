"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const studentController_1 = require("../controllers/studentController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Student self-service routes
router.get('/me/dashboard', auth_1.authenticate, (0, auth_1.authorize)('student'), studentController_1.getMyDashboard);
router.get('/me/profile', auth_1.authenticate, (0, auth_1.authorize)('student'), studentController_1.getMyProfile);
router.get('/me/attendance', auth_1.authenticate, (0, auth_1.authorize)('student'), studentController_1.getMyAttendance);
router.get('/me/marks', auth_1.authenticate, (0, auth_1.authorize)('student'), studentController_1.getMyMarks);
router.get('/me/assignments', auth_1.authenticate, (0, auth_1.authorize)('student'), studentController_1.getMyAssignments);
router.get('/me/timetable', auth_1.authenticate, (0, auth_1.authorize)('student'), studentController_1.getMyTimetable);
router.get('/me/skills', auth_1.authenticate, (0, auth_1.authorize)('student'), studentController_1.getMySkills);
// Staff routes
router.get('/', auth_1.authenticate, (0, auth_1.authorize)('faculty', 'mentor', 'hod', 'admin', 'principal'), studentController_1.listStudents);
router.get('/:studentId/digital-twin', auth_1.authenticate, (0, auth_1.authorize)('faculty', 'mentor', 'hod', 'admin', 'principal', 'student'), studentController_1.getStudentDigitalTwin);
exports.default = router;
//# sourceMappingURL=students.js.map
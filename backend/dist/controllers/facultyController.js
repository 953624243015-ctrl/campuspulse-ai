"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkloadAnalytics = exports.acknowledgeRiskAlert = exports.getAtRiskStudents = exports.createAssignment = exports.createMentoringSession = exports.getMyMentees = exports.markAttendance = exports.createAttendanceSession = exports.getMyStudents = exports.getFacultyDashboard = void 0;
const pool_1 = require("../db/pool");
const response_1 = require("../utils/response");
// GET /api/faculty/me/dashboard
const getFacultyDashboard = async (req, res) => {
    try {
        const fr = await (0, pool_1.query)(`SELECT f.id, f.employee_id, f.designation, u.first_name, u.last_name, u.department_id,
              d.name as dept_name
       FROM faculty f
       JOIN users u ON f.user_id = u.id
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE f.user_id = $1`, [req.user.userId]);
        if (!fr.rows.length) {
            (0, response_1.sendNotFound)(res, 'Faculty');
            return;
        }
        const faculty = fr.rows[0];
        // Classes today
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const todaySlots = await (0, pool_1.query)(`SELECT ts.period_number, ts.start_time, ts.end_time,
              sub.name as subject_name, sub.code, sec.name as section_name,
              cl.name as room_name
       FROM timetable_slots ts
       JOIN subjects sub ON ts.subject_id = sub.id
       JOIN sections sec ON ts.section_id = sec.id
       LEFT JOIN campus_locations cl ON ts.room_id = cl.id
       WHERE ts.faculty_id = $1 AND ts.day_of_week = $2 AND ts.is_active = TRUE
       ORDER BY ts.period_number`, [faculty.id, today]);
        // Assigned subjects this semester
        const subjects = await (0, pool_1.query)(`SELECT DISTINCT sub.id, sub.name, sub.code, sec.name as section_name,
              fs.section_id
       FROM faculty_subjects fs
       JOIN subjects sub ON fs.subject_id = sub.id
       JOIN sections sec ON fs.section_id = sec.id
       WHERE fs.faculty_id = $1 AND fs.is_active = TRUE
       ORDER BY sub.name`, [faculty.id]);
        // Pending assignment grading
        const pendingGrading = await (0, pool_1.query)(`SELECT COUNT(*) as count
       FROM assignment_submissions sub2
       JOIN assignments a ON sub2.assignment_id = a.id
       WHERE a.faculty_id = $1 AND sub2.status = 'submitted'`, [faculty.id]);
        // Active risk alerts for mentees
        const riskAlerts = await (0, pool_1.query)(`SELECT COUNT(*) as count FROM risk_alerts ra
       JOIN mentor_assignments ma ON ma.student_id = ra.student_id
       WHERE ma.mentor_id = $1 AND ra.is_active = TRUE AND ra.acknowledged_at IS NULL`, [faculty.id]);
        // Mentee count
        const mentees = await (0, pool_1.query)('SELECT COUNT(*) as count FROM mentor_assignments WHERE mentor_id = $1 AND is_active = TRUE', [faculty.id]);
        // Unread notifications
        const notifs = await (0, pool_1.query)('SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE', [req.user.userId]);
        (0, response_1.sendSuccess)(res, {
            faculty: {
                id: faculty.id,
                name: `${faculty.first_name} ${faculty.last_name}`,
                employeeId: faculty.employee_id,
                designation: faculty.designation,
                deptName: faculty.dept_name,
            },
            todayClasses: todaySlots.rows,
            assignedSubjects: subjects.rows,
            pendingGrading: parseInt(pendingGrading.rows[0]?.count || '0'),
            activeRiskAlerts: parseInt(riskAlerts.rows[0]?.count || '0'),
            menteeCount: parseInt(mentees.rows[0]?.count || '0'),
            unreadNotifications: parseInt(notifs.rows[0]?.count || '0'),
        });
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to fetch faculty dashboard', 500);
    }
};
exports.getFacultyDashboard = getFacultyDashboard;
// GET /api/faculty/me/students – all students in my sections
const getMyStudents = async (req, res) => {
    try {
        const fr = await (0, pool_1.query)('SELECT id FROM faculty WHERE user_id = $1', [req.user.userId]);
        if (!fr.rows.length) {
            (0, response_1.sendNotFound)(res, 'Faculty');
            return;
        }
        const result = await (0, pool_1.query)(`SELECT DISTINCT u.id, u.first_name, u.last_name, u.email, u.phone,
              s.id as student_id, s.roll_number, s.current_semester,
              sec.name as section_name, d.name as dept_name
       FROM faculty_subjects fs
       JOIN sections sec ON fs.section_id = sec.id
       JOIN students s ON s.section_id = sec.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE fs.faculty_id = $1 AND fs.is_active = TRUE
       ORDER BY s.roll_number`, [fr.rows[0].id]);
        (0, response_1.sendSuccess)(res, result.rows);
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to fetch students', 500);
    }
};
exports.getMyStudents = getMyStudents;
// POST /api/faculty/attendance/session – create/open a session
const createAttendanceSession = async (req, res) => {
    try {
        const { subjectId, sectionId, sessionDate, periodNumber } = req.body;
        if (!subjectId || !sectionId || !sessionDate || !periodNumber) {
            (0, response_1.sendError)(res, 'subjectId, sectionId, sessionDate, periodNumber are required', 400);
            return;
        }
        const fr = await (0, pool_1.query)('SELECT id FROM faculty WHERE user_id = $1', [req.user.userId]);
        if (!fr.rows.length) {
            (0, response_1.sendNotFound)(res, 'Faculty');
            return;
        }
        // Count students in section
        const sc = await (0, pool_1.query)('SELECT COUNT(*) as total FROM students WHERE section_id = $1', [sectionId]);
        const existing = await (0, pool_1.query)(`SELECT id FROM attendance_sessions
       WHERE subject_id = $1 AND section_id = $2 AND session_date = $3 AND period_number = $4`, [subjectId, sectionId, sessionDate, periodNumber]);
        if (existing.rows.length) {
            (0, response_1.sendSuccess)(res, existing.rows[0], 'Session already exists');
            return;
        }
        const result = await (0, pool_1.query)(`INSERT INTO attendance_sessions (faculty_id, subject_id, section_id, session_date, period_number, total_students)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [fr.rows[0].id, subjectId, sectionId, sessionDate, periodNumber, sc.rows[0].total]);
        (0, response_1.sendSuccess)(res, result.rows[0], 'Attendance session created', 201);
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to create attendance session', 500);
    }
};
exports.createAttendanceSession = createAttendanceSession;
// POST /api/faculty/attendance/mark – mark attendance for session
const markAttendance = async (req, res) => {
    try {
        const { sessionId, records } = req.body;
        // records: [{ studentId, status }]
        if (!sessionId || !Array.isArray(records)) {
            (0, response_1.sendError)(res, 'sessionId and records[] required', 400);
            return;
        }
        const client = await require('../db/pool').getClient();
        try {
            await client.query('BEGIN');
            for (const rec of records) {
                await client.query(`INSERT INTO attendance_records (session_id, student_id, status)
           VALUES ($1, $2, $3)
           ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status`, [sessionId, rec.studentId, rec.status || 'absent']);
            }
            // Update session counts
            await client.query(`UPDATE attendance_sessions
         SET present_count = (
           SELECT COUNT(*) FROM attendance_records
           WHERE session_id = $1 AND status IN ('present','late')
         ), is_finalized = TRUE
         WHERE id = $1`, [sessionId]);
            await client.query('COMMIT');
            (0, response_1.sendSuccess)(res, { sessionId, markedCount: records.length }, 'Attendance marked successfully');
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            client.release();
        }
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to mark attendance', 500);
    }
};
exports.markAttendance = markAttendance;
// GET /api/faculty/me/mentees
const getMyMentees = async (req, res) => {
    try {
        const fr = await (0, pool_1.query)('SELECT id FROM faculty WHERE user_id = $1', [req.user.userId]);
        if (!fr.rows.length) {
            (0, response_1.sendNotFound)(res, 'Faculty');
            return;
        }
        const result = await (0, pool_1.query)(`SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.profile_image_url,
              s.id as student_id, s.roll_number, s.current_semester,
              sec.name as section_name, d.name as dept_name,
              ra.risk_level,
              ROUND(
                (COUNT(ar.id) FILTER (WHERE ar.status IN ('present','late'))::numeric /
                 NULLIF(COUNT(ar.id), 0)) * 100, 1
              ) as attendance_pct
       FROM mentor_assignments ma
       JOIN students s ON ma.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN sections sec ON s.section_id = sec.id
       LEFT JOIN risk_alerts ra ON ra.student_id = s.id AND ra.is_active = TRUE
       LEFT JOIN attendance_records ar ON ar.student_id = s.id
       WHERE ma.mentor_id = $1 AND ma.is_active = TRUE
       GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.profile_image_url,
                s.id, s.roll_number, s.current_semester, sec.name, d.name, ra.risk_level
       ORDER BY s.roll_number`, [fr.rows[0].id]);
        (0, response_1.sendSuccess)(res, result.rows);
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to fetch mentees', 500);
    }
};
exports.getMyMentees = getMyMentees;
// POST /api/faculty/mentoring/session
const createMentoringSession = async (req, res) => {
    try {
        const { studentId, sessionDate, durationMinutes, discussionPoints, actionItems, nextMeetingDate } = req.body;
        const fr = await (0, pool_1.query)('SELECT id FROM faculty WHERE user_id = $1', [req.user.userId]);
        if (!fr.rows.length) {
            (0, response_1.sendNotFound)(res, 'Faculty');
            return;
        }
        const result = await (0, pool_1.query)(`INSERT INTO mentoring_sessions
         (mentor_id, student_id, session_date, duration_minutes, discussion_points, action_items, next_meeting_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [fr.rows[0].id, studentId, sessionDate, durationMinutes || 30,
            discussionPoints, actionItems || [], nextMeetingDate || null]);
        (0, response_1.sendSuccess)(res, result.rows[0], 'Mentoring session recorded', 201);
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to record mentoring session', 500);
    }
};
exports.createMentoringSession = createMentoringSession;
// POST /api/faculty/assignments
const createAssignment = async (req, res) => {
    try {
        const { title, description, subjectId, sectionId, dueDate, maxMarks } = req.body;
        if (!title || !subjectId || !sectionId || !dueDate) {
            (0, response_1.sendError)(res, 'title, subjectId, sectionId, dueDate are required', 400);
            return;
        }
        const fr = await (0, pool_1.query)('SELECT id FROM faculty WHERE user_id = $1', [req.user.userId]);
        if (!fr.rows.length) {
            (0, response_1.sendNotFound)(res, 'Faculty');
            return;
        }
        const result = await (0, pool_1.query)(`INSERT INTO assignments (title, description, subject_id, faculty_id, section_id, due_date, max_marks)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [title, description, subjectId, fr.rows[0].id, sectionId, dueDate, maxMarks || 10]);
        (0, response_1.sendSuccess)(res, result.rows[0], 'Assignment created', 201);
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to create assignment', 500);
    }
};
exports.createAssignment = createAssignment;
// GET /api/faculty/me/at-risk-students
const getAtRiskStudents = async (req, res) => {
    try {
        const fr = await (0, pool_1.query)('SELECT id FROM faculty WHERE user_id = $1', [req.user.userId]);
        if (!fr.rows.length) {
            (0, response_1.sendNotFound)(res, 'Faculty');
            return;
        }
        const result = await (0, pool_1.query)(`SELECT ra.id as alert_id, ra.risk_level, ra.risk_factors, ra.recommendation,
              ra.generated_at, ra.acknowledged_at,
              u.first_name, u.last_name, s.roll_number, s.id as student_id,
              sec.name as section_name
       FROM risk_alerts ra
       JOIN students s ON ra.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN sections sec ON s.section_id = sec.id
       WHERE ra.is_active = TRUE
       AND (
         s.section_id IN (
           SELECT section_id FROM faculty_subjects WHERE faculty_id = $1 AND is_active = TRUE
         )
         OR ra.student_id IN (
           SELECT student_id FROM mentor_assignments WHERE mentor_id = $1 AND is_active = TRUE
         )
       )
       ORDER BY
         CASE ra.risk_level WHEN 'high' THEN 1 WHEN 'moderate' THEN 2 ELSE 3 END,
         ra.generated_at DESC`, [fr.rows[0].id]);
        (0, response_1.sendSuccess)(res, result.rows);
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to fetch at-risk students', 500);
    }
};
exports.getAtRiskStudents = getAtRiskStudents;
// PATCH /api/faculty/risk-alerts/:alertId/acknowledge
const acknowledgeRiskAlert = async (req, res) => {
    try {
        const { alertId } = req.params;
        const { followUpNotes } = req.body;
        await (0, pool_1.query)(`UPDATE risk_alerts
       SET acknowledged_by = $1, acknowledged_at = NOW(), follow_up_notes = $2
       WHERE id = $3`, [req.user.userId, followUpNotes || null, alertId]);
        (0, response_1.sendSuccess)(res, null, 'Alert acknowledged');
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to acknowledge alert', 500);
    }
};
exports.acknowledgeRiskAlert = acknowledgeRiskAlert;
// GET /api/faculty/me/workload
const getWorkloadAnalytics = async (req, res) => {
    try {
        const fr = await (0, pool_1.query)('SELECT id FROM faculty WHERE user_id = $1', [req.user.userId]);
        if (!fr.rows.length) {
            (0, response_1.sendNotFound)(res, 'Faculty');
            return;
        }
        const subjects = await (0, pool_1.query)(`SELECT sub.name, sub.code, sub.hours_per_week, sub.is_lab, sec.name as section_name,
              COUNT(DISTINCT ases.id) as sessions_conducted
       FROM faculty_subjects fs
       JOIN subjects sub ON fs.subject_id = sub.id
       JOIN sections sec ON fs.section_id = sec.id
       LEFT JOIN attendance_sessions ases ON ases.subject_id = sub.id AND ases.section_id = fs.section_id
                 AND ases.faculty_id = $1
       WHERE fs.faculty_id = $1 AND fs.is_active = TRUE
       GROUP BY sub.name, sub.code, sub.hours_per_week, sub.is_lab, sec.name
       ORDER BY sub.name`, [fr.rows[0].id]);
        const totalHours = subjects.rows.reduce((sum, s) => sum + (s.hours_per_week || 0), 0);
        const menteeCount = await (0, pool_1.query)('SELECT COUNT(*) as count FROM mentor_assignments WHERE mentor_id = $1 AND is_active = TRUE', [fr.rows[0].id]);
        (0, response_1.sendSuccess)(res, {
            subjects: subjects.rows,
            totalWeeklyHours: totalHours,
            subjectCount: subjects.rows.length,
            menteeCount: parseInt(menteeCount.rows[0]?.count || '0'),
        });
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to fetch workload analytics', 500);
    }
};
exports.getWorkloadAnalytics = getWorkloadAnalytics;
//# sourceMappingURL=facultyController.js.map
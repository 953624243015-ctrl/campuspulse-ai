import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { query } from '../db/pool';
import { sendSuccess, sendError, sendNotFound, getPagination, buildMeta } from '../utils/response';

// GET /api/students/me – student's own profile
export const getMyProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.gender,
              u.profile_image_url, u.department_id, u.last_login,
              s.id as student_id, s.roll_number, s.register_number, s.current_semester,
              s.admission_date, s.father_name, s.mother_name, s.guardian_phone,
              s.blood_group, s.is_hosteler, s.transport_route,
              sec.name as section_name, sec.id as section_id,
              b.name as batch_name, b.start_year, b.end_year,
              d.name as department_name, d.code as department_code,
              c.name as course_name
       FROM users u
       JOIN students s ON s.user_id = u.id
       LEFT JOIN sections sec ON s.section_id = sec.id
       LEFT JOIN batches b ON s.batch_id = b.id
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN courses c ON b.course_id = c.id
       WHERE u.id = $1`,
      [req.user!.userId]
    );
    if (result.rows.length === 0) {
      sendNotFound(res, 'Student profile');
      return;
    }
    sendSuccess(res, result.rows[0]);
  } catch {
    sendError(res, 'Failed to fetch student profile', 500);
  }
};

// GET /api/students/me/attendance
export const getMyAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { semester, subjectId } = req.query;

    // Get student id
    const sr = await query('SELECT id, current_semester FROM students WHERE user_id = $1', [req.user!.userId]);
    if (!sr.rows.length) { sendNotFound(res, 'Student'); return; }
    const student = sr.rows[0];
    const sem = semester || student.current_semester;

    let queryText = `
      SELECT sub.id as subject_id, sub.name as subject_name, sub.code as subject_code,
             COUNT(ar.id) FILTER (WHERE ar.status = 'present') as present,
             COUNT(ar.id) FILTER (WHERE ar.status = 'absent') as absent,
             COUNT(ar.id) FILTER (WHERE ar.status = 'late') as late,
             COUNT(ar.id) as total,
             ROUND(
               (COUNT(ar.id) FILTER (WHERE ar.status IN ('present','late'))::numeric /
                NULLIF(COUNT(ar.id), 0)) * 100, 2
             ) as attendance_pct
      FROM attendance_records ar
      JOIN attendance_sessions ases ON ar.session_id = ases.id
      JOIN subjects sub ON ases.subject_id = sub.id
      JOIN enrollments e ON e.student_id = $1 AND e.subject_id = sub.id
      WHERE ar.student_id = $1 AND sub.semester = $2
    `;
    const params: unknown[] = [student.id, sem];

    if (subjectId) {
      queryText += ' AND sub.id = $3';
      params.push(subjectId);
    }
    queryText += ' GROUP BY sub.id, sub.name, sub.code ORDER BY sub.name';

    const result = await query(queryText, params);

    // Overall stats
    const overall = await query(
      `SELECT
         COUNT(ar.id) FILTER (WHERE ar.status = 'present') as total_present,
         COUNT(ar.id) FILTER (WHERE ar.status = 'absent') as total_absent,
         COUNT(ar.id) as total_classes,
         ROUND(
           (COUNT(ar.id) FILTER (WHERE ar.status IN ('present','late'))::numeric /
            NULLIF(COUNT(ar.id), 0)) * 100, 2
         ) as overall_pct
       FROM attendance_records ar
       JOIN attendance_sessions ases ON ar.session_id = ases.id
       JOIN subjects sub ON ases.subject_id = sub.id
       WHERE ar.student_id = $1 AND sub.semester = $2`,
      [student.id, sem]
    );

    sendSuccess(res, {
      subjects: result.rows,
      overall: overall.rows[0],
      semester: sem,
    });
  } catch {
    sendError(res, 'Failed to fetch attendance', 500);
  }
};

// GET /api/students/me/marks
export const getMyMarks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { semester } = req.query;
    const sr = await query('SELECT id, current_semester FROM students WHERE user_id = $1', [req.user!.userId]);
    if (!sr.rows.length) { sendNotFound(res, 'Student'); return; }
    const student = sr.rows[0];
    const sem = semester || student.current_semester;

    const result = await query(
      `SELECT m.id, m.marks_obtained, m.max_marks, m.grade, m.semester,
              sub.name as subject_name, sub.code as subject_code,
              at.name as assessment_name, at.code as assessment_code, at.weightage
       FROM marks m
       JOIN subjects sub ON m.subject_id = sub.id
       JOIN assessment_types at ON m.assessment_type_id = at.id
       WHERE m.student_id = $1 AND m.semester = $2
       ORDER BY sub.name, at.code`,
      [student.id, sem]
    );

    // Group by subject
    const bySubject: Record<string, unknown[]> = {};
    for (const row of result.rows) {
      if (!bySubject[row.subject_code]) bySubject[row.subject_code] = [];
      (bySubject[row.subject_code] as unknown[]).push(row);
    }

    sendSuccess(res, { marks: result.rows, bySubject, semester: sem });
  } catch {
    sendError(res, 'Failed to fetch marks', 500);
  }
};

// GET /api/students/me/assignments
export const getMyAssignments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const sr = await query(
      'SELECT id, section_id, current_semester FROM students WHERE user_id = $1',
      [req.user!.userId]
    );
    if (!sr.rows.length) { sendNotFound(res, 'Student'); return; }
    const student = sr.rows[0];

    const result = await query(
      `SELECT a.id, a.title, a.description, a.due_date, a.max_marks, a.status,
              sub.name as subject_name, sub.code as subject_code,
              u.first_name || ' ' || u.last_name as faculty_name,
              sub2.id as submission_id, sub2.submitted_at, sub2.marks_obtained,
              sub2.status as submission_status, sub2.feedback
       FROM assignments a
       JOIN subjects sub ON a.subject_id = sub.id
       JOIN faculty f ON a.faculty_id = f.id
       JOIN users u ON f.user_id = u.id
       LEFT JOIN assignment_submissions sub2 ON sub2.assignment_id = a.id AND sub2.student_id = $1
       WHERE a.section_id = $2 AND a.status = 'published'
       ORDER BY a.due_date`,
      [student.id, student.section_id]
    );

    const pending = result.rows.filter((r) => !r.submission_id && new Date(r.due_date) > new Date());
    const submitted = result.rows.filter((r) => r.submission_id);
    const overdue = result.rows.filter((r) => !r.submission_id && new Date(r.due_date) <= new Date());

    sendSuccess(res, { assignments: result.rows, pending, submitted, overdue });
  } catch {
    sendError(res, 'Failed to fetch assignments', 500);
  }
};

// GET /api/students/me/timetable
export const getMyTimetable = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const sr = await query(
      'SELECT s.id, s.section_id, s.current_semester FROM students s WHERE s.user_id = $1',
      [req.user!.userId]
    );
    if (!sr.rows.length) { sendNotFound(res, 'Student'); return; }
    const student = sr.rows[0];

    const result = await query(
      `SELECT ts.id, ts.day_of_week, ts.period_number, ts.start_time, ts.end_time,
              sub.name as subject_name, sub.code as subject_code, sub.is_lab,
              u.first_name || ' ' || u.last_name as faculty_name,
              cl.name as room_name, cl.code as room_code
       FROM timetable_slots ts
       JOIN subjects sub ON ts.subject_id = sub.id
       JOIN faculty f ON ts.faculty_id = f.id
       JOIN users u ON f.user_id = u.id
       LEFT JOIN campus_locations cl ON ts.room_id = cl.id
       WHERE ts.section_id = $1 AND ts.semester = $2 AND ts.is_active = TRUE
       ORDER BY
         CASE ts.day_of_week
           WHEN 'monday' THEN 1 WHEN 'tuesday' THEN 2 WHEN 'wednesday' THEN 3
           WHEN 'thursday' THEN 4 WHEN 'friday' THEN 5 WHEN 'saturday' THEN 6
         END,
         ts.period_number`,
      [student.section_id, student.current_semester]
    );

    // Group by day
    const byDay: Record<string, unknown[]> = {};
    for (const slot of result.rows) {
      if (!byDay[slot.day_of_week]) byDay[slot.day_of_week] = [];
      (byDay[slot.day_of_week] as unknown[]).push(slot);
    }

    sendSuccess(res, { slots: result.rows, byDay });
  } catch {
    sendError(res, 'Failed to fetch timetable', 500);
  }
};

// GET /api/students/me/skills
export const getMySkills = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const sr = await query('SELECT id FROM students WHERE user_id = $1', [req.user!.userId]);
    if (!sr.rows.length) { sendNotFound(res, 'Student'); return; }

    const result = await query(
      `SELECT ss.id, ss.proficiency_level, ss.acquired_date, ss.evidence_url,
              sk.name as skill_name, sk.id as skill_id,
              sc.name as category_name
       FROM student_skills ss
       JOIN skills sk ON ss.skill_id = sk.id
       LEFT JOIN skill_categories sc ON sk.category_id = sc.id
       WHERE ss.student_id = $1
       ORDER BY sc.name, sk.name`,
      [sr.rows[0].id]
    );

    sendSuccess(res, { skills: result.rows });
  } catch {
    sendError(res, 'Failed to fetch skills', 500);
  }
};

// GET /api/students/me/dashboard
export const getMyDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const sr = await query(
      `SELECT s.id, s.current_semester, s.section_id, s.roll_number,
              u.first_name, u.last_name, u.department_id,
              d.name as department_name, d.code as department_code
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE s.user_id = $1`,
      [req.user!.userId]
    );
    if (!sr.rows.length) { sendNotFound(res, 'Student'); return; }
    const student = sr.rows[0];

    // Attendance summary
    const attResult = await query(
      `SELECT ROUND(
         (COUNT(ar.id) FILTER (WHERE ar.status IN ('present','late'))::numeric /
          NULLIF(COUNT(ar.id), 0)) * 100, 1
       ) as overall_pct,
       COUNT(ar.id) FILTER (WHERE ar.status = 'absent') as absences_this_month
       FROM attendance_records ar
       JOIN attendance_sessions ases ON ar.session_id = ases.id
       JOIN subjects sub ON ases.subject_id = sub.id
       WHERE ar.student_id = $1 AND sub.semester = $2`,
      [student.id, student.current_semester]
    );

    // Pending assignments
    const pendingAssignments = await query(
      `SELECT COUNT(*) as count FROM assignments a
       WHERE a.section_id = $1 AND a.status = 'published'
       AND a.due_date > NOW()
       AND NOT EXISTS (
         SELECT 1 FROM assignment_submissions sub
         WHERE sub.assignment_id = a.id AND sub.student_id = $2
       )`,
      [student.section_id, student.id]
    );

    // Upcoming events
    const upcomingEvents = await query(
      `SELECT id, title, event_type, start_datetime, status
       FROM events
       WHERE status = 'upcoming' AND start_datetime > NOW()
       ORDER BY start_datetime LIMIT 3`
    );

    // Unread notifications
    const notifCount = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [req.user!.userId]
    );

    // Active risk alert
    const riskAlert = await query(
      `SELECT risk_level, recommendation, generated_at
       FROM risk_alerts WHERE student_id = $1 AND is_active = TRUE
       ORDER BY generated_at DESC LIMIT 1`,
      [student.id]
    );

    // Recent marks average
    const marksAvg = await query(
      `SELECT ROUND(AVG(marks_obtained / NULLIF(max_marks, 0) * 100)::numeric, 1) as avg_pct
       FROM marks WHERE student_id = $1 AND semester = $2`,
      [student.id, student.current_semester]
    );

    sendSuccess(res, {
      student: {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        rollNumber: student.roll_number,
        semester: student.current_semester,
        departmentName: student.department_name,
        departmentCode: student.department_code,
      },
      attendance: {
        overallPct: parseFloat(attResult.rows[0]?.overall_pct || '0'),
        absencesThisMonth: parseInt(attResult.rows[0]?.absences_this_month || '0'),
      },
      pendingAssignments: parseInt(pendingAssignments.rows[0]?.count || '0'),
      upcomingEvents: upcomingEvents.rows,
      unreadNotifications: parseInt(notifCount.rows[0]?.count || '0'),
      riskAlert: riskAlert.rows[0] || null,
      marksAvgPct: parseFloat(marksAvg.rows[0]?.avg_pct || '0'),
    });
  } catch (err) {
    sendError(res, 'Failed to fetch dashboard', 500);
  }
};

// GET /api/students (admin / hod / faculty)
export const listStudents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, departmentId, sectionId, search } = req.query;
    const { limit: l, offset } = getPagination(page, limit);

    const conditions: string[] = ["u.deleted_at IS NULL"];
    const params: unknown[] = [];
    let pi = 1;

    if (departmentId) { conditions.push(`u.department_id = $${pi++}`); params.push(departmentId); }
    if (sectionId) { conditions.push(`s.section_id = $${pi++}`); params.push(sectionId); }
    if (search) {
      conditions.push(`(u.first_name ILIKE $${pi} OR u.last_name ILIKE $${pi} OR s.roll_number ILIKE $${pi})`);
      params.push(`%${search}%`); pi++;
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM users u JOIN students s ON s.user_id = u.id ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.profile_image_url,
              s.id as student_id, s.roll_number, s.current_semester, s.is_hosteler,
              sec.name as section_name, b.name as batch_name, d.name as dept_name
       FROM users u
       JOIN students s ON s.user_id = u.id
       LEFT JOIN sections sec ON s.section_id = sec.id
       LEFT JOIN batches b ON s.batch_id = b.id
       LEFT JOIN departments d ON u.department_id = d.id
       ${where}
       ORDER BY s.roll_number
       LIMIT $${pi++} OFFSET $${pi++}`,
      [...params, l, offset]
    );

    sendSuccess(res, result.rows, undefined, 200, buildMeta(Number(page), l, total));
  } catch {
    sendError(res, 'Failed to fetch students', 500);
  }
};

// GET /api/students/:studentId/digital-twin
export const getStudentDigitalTwin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    const student = await query(
      `SELECT s.id, s.current_semester, u.first_name, u.last_name, s.roll_number
       FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = $1`,
      [studentId]
    );
    if (!student.rows.length) { sendNotFound(res, 'Student'); return; }
    const st = student.rows[0];

    // Attendance
    const attendance = await query(
      `SELECT ROUND(
         (COUNT(ar.id) FILTER (WHERE ar.status IN ('present','late'))::numeric /
          NULLIF(COUNT(ar.id), 0)) * 100, 1
       ) as pct, COUNT(ar.id) as total
       FROM attendance_records ar
       JOIN attendance_sessions ases ON ar.session_id = ases.id
       JOIN subjects sub ON ases.subject_id = sub.id
       WHERE ar.student_id = $1 AND sub.semester = $2`,
      [st.id, st.current_semester]
    );

    // Marks
    const marks = await query(
      `SELECT ROUND(AVG(marks_obtained / NULLIF(max_marks, 0) * 100)::numeric, 1) as avg_pct
       FROM marks WHERE student_id = $1 AND semester = $2`,
      [st.id, st.current_semester]
    );

    // Assignments
    const assignments = await query(
      `SELECT COUNT(*) as total,
              COUNT(*) FILTER (WHERE sub2.id IS NOT NULL) as submitted
       FROM assignments a
       JOIN sections sec ON a.section_id = sec.id
       JOIN students s ON s.section_id = sec.id AND s.id = $1
       LEFT JOIN assignment_submissions sub2 ON sub2.assignment_id = a.id AND sub2.student_id = $1
       WHERE a.status = 'published'`,
      [st.id]
    );

    // Skills
    const skills = await query(
      `SELECT sk.name, ss.proficiency_level, sc.name as category
       FROM student_skills ss
       JOIN skills sk ON ss.skill_id = sk.id
       LEFT JOIN skill_categories sc ON sk.category_id = sc.id
       WHERE ss.student_id = $1`,
      [st.id]
    );

    // Certifications
    const certs = await query(
      'SELECT COUNT(*) as count FROM certifications WHERE student_id = $1',
      [st.id]
    );

    // Events
    const events = await query(
      `SELECT COUNT(*) as count FROM event_registrations er
       JOIN users u ON u.id = er.user_id
       JOIN students s ON s.user_id = u.id
       WHERE s.id = $1 AND er.attendance_marked = TRUE`,
      [st.id]
    );

    // Clubs
    const clubs = await query(
      `SELECT c.name, cm.role FROM club_memberships cm
       JOIN clubs c ON cm.club_id = c.id
       WHERE cm.student_id = $1 AND cm.is_active = TRUE`,
      [st.id]
    );

    // Risk alert
    const risk = await query(
      `SELECT risk_level, risk_factors, recommendation FROM risk_alerts
       WHERE student_id = $1 AND is_active = TRUE
       ORDER BY generated_at DESC LIMIT 1`,
      [st.id]
    );

    const attendancePct = parseFloat(attendance.rows[0]?.pct || '0');
    const marksPct = parseFloat(marks.rows[0]?.avg_pct || '0');
    const totalAssign = parseInt(assignments.rows[0]?.total || '0');
    const submittedAssign = parseInt(assignments.rows[0]?.submitted || '0');
    const completionRate = totalAssign > 0 ? Math.round((submittedAssign / totalAssign) * 100) : 0;

    // Compute engagement score (0-100)
    const engagementScore = Math.round(
      attendancePct * 0.35 +
      marksPct * 0.30 +
      completionRate * 0.20 +
      Math.min(skills.rows.length * 5, 10) * 0.15
    );

    sendSuccess(res, {
      student: {
        id: st.id,
        name: `${st.first_name} ${st.last_name}`,
        rollNumber: st.roll_number,
        semester: st.current_semester,
      },
      academic: {
        attendancePct,
        marksPct,
        assignmentCompletionRate: completionRate,
        totalAssignments: totalAssign,
        submittedAssignments: submittedAssign,
      },
      engagement: {
        score: engagementScore,
        eventsAttended: parseInt(events.rows[0]?.count || '0'),
        clubsJoined: clubs.rows.length,
        clubs: clubs.rows,
        certificationsEarned: parseInt(certs.rows[0]?.count || '0'),
      },
      skills: {
        total: skills.rows.length,
        items: skills.rows,
      },
      riskAlert: risk.rows[0] || null,
      note: 'This Digital Twin is a support tool to help identify improvement areas — not a ranking system.',
    });
  } catch {
    sendError(res, 'Failed to generate student digital twin', 500);
  }
};

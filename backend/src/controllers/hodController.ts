import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { query } from '../db/pool';
import { sendSuccess, sendError, sendNotFound } from '../utils/response';

// GET /api/hod/dashboard
export const getHODDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const deptId = req.user!.departmentId;
    if (!deptId) { sendError(res, 'Department not assigned', 400); return; }

    const [dept, students, faculty, subjects] = await Promise.all([
      query(`SELECT d.*, u.first_name || ' ' || u.last_name as hod_name
             FROM departments d LEFT JOIN users u ON d.hod_id = u.id WHERE d.id = $1`, [deptId]),
      query(`SELECT COUNT(*) as count FROM students s
             JOIN users u ON s.user_id = u.id WHERE u.department_id = $1`, [deptId]),
      query(`SELECT COUNT(*) as count FROM faculty f
             JOIN users u ON f.user_id = u.id WHERE u.department_id = $1`, [deptId]),
      query(`SELECT COUNT(*) as count FROM subjects WHERE department_id = $1 AND is_active = TRUE`, [deptId]),
    ]);

    // Attendance analytics
    const attendanceStats = await query(
      `SELECT
         ROUND(AVG(sub_att.pct)::numeric, 1) as avg_attendance
       FROM (
         SELECT
           ROUND((COUNT(ar.id) FILTER (WHERE ar.status IN ('present','late'))::numeric /
            NULLIF(COUNT(ar.id), 0)) * 100, 1) as pct
         FROM attendance_records ar
         JOIN attendance_sessions ases ON ar.session_id = ases.id
         JOIN subjects sub ON ases.subject_id = sub.id
         WHERE sub.department_id = $1
         GROUP BY ar.student_id
       ) sub_att`,
      [deptId]
    );

    // At-risk count
    const riskCount = await query(
      `SELECT COUNT(*) as count FROM risk_alerts ra
       JOIN students s ON ra.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE u.department_id = $1 AND ra.is_active = TRUE`,
      [deptId]
    );

    // Open complaints
    const complaints = await query(
      `SELECT COUNT(*) as count FROM complaints c
       JOIN users u ON c.submitted_by = u.id
       WHERE u.department_id = $1 AND c.status NOT IN ('resolved','verified','closed')`,
      [deptId]
    );

    // AI insights for dept
    const insights = await query(
      `SELECT id, title, description, severity, generated_at
       FROM ai_insights
       WHERE (target_type = 'department' AND target_id = $1) OR target_type = 'campus'
       ORDER BY generated_at DESC LIMIT 5`,
      [deptId]
    );

    sendSuccess(res, {
      department: dept.rows[0],
      stats: {
        totalStudents: parseInt(students.rows[0].count),
        totalFaculty: parseInt(faculty.rows[0].count),
        totalSubjects: parseInt(subjects.rows[0].count),
        avgAttendance: parseFloat(attendanceStats.rows[0]?.avg_attendance || '0'),
        atRiskStudents: parseInt(riskCount.rows[0].count),
        openComplaints: parseInt(complaints.rows[0].count),
      },
      aiInsights: insights.rows,
    });
  } catch {
    sendError(res, 'Failed to fetch HOD dashboard', 500);
  }
};

// GET /api/hod/students/analytics
export const getDepartmentStudentAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const deptId = req.user!.departmentId;

    // Attendance distribution
    const attDist = await query(
      `SELECT
         COUNT(*) FILTER (WHERE pct >= 90) as excellent,
         COUNT(*) FILTER (WHERE pct >= 75 AND pct < 90) as good,
         COUNT(*) FILTER (WHERE pct >= 60 AND pct < 75) as borderline,
         COUNT(*) FILTER (WHERE pct < 60) as critical
       FROM (
         SELECT
           (COUNT(ar.id) FILTER (WHERE ar.status IN ('present','late'))::numeric /
            NULLIF(COUNT(ar.id), 0)) * 100 as pct
         FROM attendance_records ar
         JOIN attendance_sessions ases ON ar.session_id = ases.id
         JOIN subjects sub ON ases.subject_id = sub.id
         JOIN students s ON ar.student_id = s.id
         JOIN users u ON s.user_id = u.id
         WHERE u.department_id = $1
         GROUP BY ar.student_id
       ) sub`,
      [deptId]
    );

    // Marks distribution by subject
    const marksPerSubject = await query(
      `SELECT sub.name as subject_name, sub.code,
              ROUND(AVG(m.marks_obtained / NULLIF(m.max_marks, 0) * 100)::numeric, 1) as avg_pct,
              COUNT(DISTINCT m.student_id) as student_count
       FROM marks m
       JOIN subjects sub ON m.subject_id = sub.id
       WHERE sub.department_id = $1
       GROUP BY sub.name, sub.code ORDER BY avg_pct DESC`,
      [deptId]
    );

    // Risk summary
    const riskSummary = await query(
      `SELECT risk_level, COUNT(*) as count
       FROM risk_alerts ra
       JOIN students s ON ra.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE u.department_id = $1 AND ra.is_active = TRUE
       GROUP BY risk_level`,
      [deptId]
    );

    sendSuccess(res, {
      attendanceDistribution: attDist.rows[0],
      marksPerSubject: marksPerSubject.rows,
      riskSummary: riskSummary.rows,
    });
  } catch {
    sendError(res, 'Failed to fetch analytics', 500);
  }
};

// GET /api/hod/faculty/workload
export const getFacultyWorkload = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const deptId = req.user!.departmentId;

    const result = await query(
      `SELECT u.id, u.first_name, u.last_name, f.designation,
              COUNT(DISTINCT fs.subject_id) as subject_count,
              SUM(sub.hours_per_week) as weekly_hours,
              COUNT(DISTINCT ma.student_id) as mentee_count
       FROM faculty f
       JOIN users u ON f.user_id = u.id
       LEFT JOIN faculty_subjects fs ON fs.faculty_id = f.id AND fs.is_active = TRUE
       LEFT JOIN subjects sub ON fs.subject_id = sub.id
       LEFT JOIN mentor_assignments ma ON ma.mentor_id = f.id AND ma.is_active = TRUE
       WHERE u.department_id = $1
       GROUP BY u.id, u.first_name, u.last_name, f.designation
       ORDER BY weekly_hours DESC NULLS LAST`,
      [deptId]
    );

    sendSuccess(res, result.rows);
  } catch {
    sendError(res, 'Failed to fetch faculty workload', 500);
  }
};

// GET /api/hod/skill-gap
export const getDepartmentSkillGap = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const deptId = req.user!.departmentId;

    const skillCoverage = await query(
      `SELECT sk.name as skill_name, sc.name as category,
              COUNT(DISTINCT ss.student_id) as students_with_skill,
              (SELECT COUNT(*) FROM students s JOIN users u ON s.user_id = u.id WHERE u.department_id = $1) as total_students,
              ROUND(COUNT(DISTINCT ss.student_id)::numeric /
                    NULLIF((SELECT COUNT(*) FROM students s JOIN users u ON s.user_id = u.id WHERE u.department_id = $1), 0) * 100, 1) as coverage_pct,
              ROUND(AVG(ss.proficiency_level)::numeric, 1) as avg_proficiency
       FROM skills sk
       LEFT JOIN skill_categories sc ON sk.category_id = sc.id
       LEFT JOIN student_skills ss ON ss.skill_id = sk.id
       LEFT JOIN students st ON ss.student_id = st.id
       LEFT JOIN users u ON st.user_id = u.id AND u.department_id = $1
       WHERE sk.is_active = TRUE
       GROUP BY sk.name, sc.name
       ORDER BY coverage_pct DESC`,
      [deptId]
    );

    sendSuccess(res, { skillCoverage: skillCoverage.rows });
  } catch {
    sendError(res, 'Failed to fetch skill gap data', 500);
  }
};

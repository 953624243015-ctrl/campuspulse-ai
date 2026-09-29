import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { query } from '../db/pool';
import { sendSuccess, sendError } from '../utils/response';

// GET /api/principal/dashboard
export const getPrincipalDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [users, students, faculty, complaints, events, riskAlerts] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL AND is_active = TRUE'),
      query('SELECT COUNT(*) as count FROM students'),
      query('SELECT COUNT(*) as count FROM faculty'),
      query(`SELECT COUNT(*) as count FROM complaints WHERE status NOT IN ('resolved','verified','closed')`),
      query(`SELECT COUNT(*) as count FROM events WHERE status = 'upcoming'`),
      query('SELECT COUNT(*) as count FROM risk_alerts WHERE is_active = TRUE'),
    ]);

    // Overall attendance
    const attendance = await query(
      `SELECT ROUND(
         (COUNT(ar.id) FILTER (WHERE ar.status IN ('present','late'))::numeric /
          NULLIF(COUNT(ar.id), 0)) * 100, 1
       ) as overall_pct
       FROM attendance_records ar`
    );

    // Department-wise attendance
    const deptAttendance = await query(
      `SELECT d.name, d.code,
              ROUND(
                (COUNT(ar.id) FILTER (WHERE ar.status IN ('present','late'))::numeric /
                 NULLIF(COUNT(ar.id), 0)) * 100, 1
              ) as attendance_pct,
              COUNT(DISTINCT s.id) as students
       FROM departments d
       LEFT JOIN users u ON u.department_id = d.id
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN attendance_records ar ON ar.student_id = s.id
       WHERE d.is_active = TRUE
       GROUP BY d.name, d.code ORDER BY attendance_pct DESC NULLS LAST`
    );

    // Complaint breakdown
    const complaintBreakdown = await query(
      `SELECT status, COUNT(*) as count FROM complaints GROUP BY status ORDER BY count DESC`
    );

    // AI Insights
    const insights = await query(
      `SELECT id, insight_type, title, description, severity, generated_at, is_acknowledged
       FROM ai_insights
       WHERE is_acknowledged = FALSE
       ORDER BY
         CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
         generated_at DESC
       LIMIT 8`
    );

    // Event participation (last 3 months)
    const eventParticipation = await query(
      `SELECT DATE_TRUNC('month', e.start_datetime) as month,
              COUNT(DISTINCT e.id) as events,
              COUNT(er.id) as registrations
       FROM events e
       LEFT JOIN event_registrations er ON er.event_id = e.id
       WHERE e.start_datetime > NOW() - INTERVAL '3 months'
       GROUP BY month ORDER BY month`
    );

    sendSuccess(res, {
      kpis: {
        totalStudents: parseInt(students.rows[0].count),
        totalFaculty: parseInt(faculty.rows[0].count),
        totalUsers: parseInt(users.rows[0].count),
        openComplaints: parseInt(complaints.rows[0].count),
        upcomingEvents: parseInt(events.rows[0].count),
        atRiskStudents: parseInt(riskAlerts.rows[0].count),
        overallAttendance: parseFloat(attendance.rows[0]?.overall_pct || '0'),
      },
      departmentAttendance: deptAttendance.rows,
      complaintBreakdown: complaintBreakdown.rows,
      aiInsights: insights.rows,
      eventParticipation: eventParticipation.rows,
    });
  } catch {
    sendError(res, 'Failed to fetch principal dashboard', 500);
  }
};

// GET /api/principal/analytics/campus
export const getCampusAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Attendance trend (weekly, 12 weeks)
    const attendanceTrend = await query(
      `SELECT DATE_TRUNC('week', ases.session_date) as week,
              ROUND(
                (COUNT(ar.id) FILTER (WHERE ar.status IN ('present','late'))::numeric /
                 NULLIF(COUNT(ar.id), 0)) * 100, 1
              ) as attendance_pct
       FROM attendance_sessions ases
       JOIN attendance_records ar ON ar.session_id = ases.id
       WHERE ases.session_date > NOW() - INTERVAL '12 weeks'
       GROUP BY week ORDER BY week`
    );

    // Assignment completion trend
    const assignmentTrend = await query(
      `SELECT DATE_TRUNC('month', a.created_at) as month,
              COUNT(DISTINCT a.id) as total_assignments,
              COUNT(DISTINCT sub.id) as total_submissions,
              ROUND(COUNT(DISTINCT sub.id)::numeric / NULLIF(COUNT(DISTINCT a.id), 0) * 100, 1) as completion_rate
       FROM assignments a
       LEFT JOIN assignment_submissions sub ON sub.assignment_id = a.id
       WHERE a.created_at > NOW() - INTERVAL '6 months'
       GROUP BY month ORDER BY month`
    );

    // Student risk distribution
    const riskDistribution = await query(
      `SELECT risk_level, COUNT(*) as count
       FROM risk_alerts WHERE is_active = TRUE GROUP BY risk_level`
    );

    // Department performance
    const deptPerformance = await query(
      `SELECT d.name, d.code,
              ROUND(AVG(m.marks_obtained / NULLIF(m.max_marks, 0) * 100)::numeric, 1) as avg_marks_pct,
              COUNT(DISTINCT s.id) as student_count
       FROM departments d
       LEFT JOIN users u ON u.department_id = d.id
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN marks m ON m.student_id = s.id
       WHERE d.is_active = TRUE
       GROUP BY d.name, d.code ORDER BY avg_marks_pct DESC NULLS LAST`
    );

    sendSuccess(res, {
      attendanceTrend: attendanceTrend.rows,
      assignmentTrend: assignmentTrend.rows,
      riskDistribution: riskDistribution.rows,
      departmentPerformance: deptPerformance.rows,
    });
  } catch {
    sendError(res, 'Failed to fetch campus analytics', 500);
  }
};

// POST /api/principal/what-if
export const runWhatIfSimulation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { scenario, parameters } = req.body;
    if (!scenario) { sendError(res, 'scenario is required', 400); return; }

    let result: Record<string, unknown> = {};

    if (scenario === 'attendance_threshold_change') {
      const { newThreshold = 75 } = parameters || {};
      const affected = await query(
        `SELECT COUNT(DISTINCT s.id) as affected_students
         FROM (
           SELECT ar.student_id,
             (COUNT(ar.id) FILTER (WHERE ar.status IN ('present','late'))::numeric /
              NULLIF(COUNT(ar.id), 0)) * 100 as pct
           FROM attendance_records ar GROUP BY ar.student_id
         ) sa
         JOIN students s ON s.id = sa.student_id
         WHERE sa.pct < $1`,
        [newThreshold]
      );

      result = {
        scenario: 'attendance_threshold_change',
        parameters: { newThreshold },
        affectedStudents: parseInt(affected.rows[0]?.affected_students || '0'),
        description: `If the minimum attendance requirement is changed to ${newThreshold}%, approximately ${affected.rows[0]?.affected_students || 0} students would be affected.`,
        disclaimer: 'This is a scenario estimate based on current data. Not a guaranteed prediction.',
      };
    } else if (scenario === 'classroom_unavailable') {
      const { locationId } = parameters || {};
      const impact = await query(
        `SELECT COUNT(*) as affected_slots
         FROM timetable_slots WHERE room_id = $1 AND is_active = TRUE`,
        [locationId]
      );
      result = {
        scenario: 'classroom_unavailable',
        affectedSlots: parseInt(impact.rows[0]?.affected_slots || '0'),
        description: `Making this location unavailable would affect ${impact.rows[0]?.affected_slots || 0} active timetable slots.`,
        disclaimer: 'This is a scenario estimate. Actual impact depends on scheduling and availability.',
      };
    } else {
      result = {
        scenario,
        description: 'Custom scenario analysis. Insufficient data for a detailed estimate with the provided parameters.',
        disclaimer: 'What-if scenarios are estimates only. Contact the data team for detailed analysis.',
      };
    }

    sendSuccess(res, result);
  } catch {
    sendError(res, 'Failed to run simulation', 500);
  }
};

// PATCH /api/principal/insights/:id/acknowledge
export const acknowledgeInsight = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await query(
      'UPDATE ai_insights SET is_acknowledged = TRUE, acknowledged_by = $1 WHERE id = $2',
      [req.user!.userId, req.params.id]
    );
    sendSuccess(res, null, 'Insight acknowledged');
  } catch {
    sendError(res, 'Failed to acknowledge insight', 500);
  }
};

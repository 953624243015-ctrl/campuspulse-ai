import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { query } from '../db/pool';
import { sendSuccess, sendError, sendNotFound, getPagination, buildMeta } from '../utils/response';

// GET /api/events
export const getEvents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, departmentId } = req.query;
    const { limit: l, offset } = getPagination(page, limit);

    const conditions: string[] = [];
    const params: unknown[] = [];
    let pi = 1;

    if (status) { conditions.push(`e.status = $${pi++}`); params.push(status); }
    if (departmentId) {
      conditions.push(`(e.department_id = $${pi} OR e.is_college_wide = TRUE)`);
      params.push(departmentId); pi++;
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const countRes = await query(`SELECT COUNT(*) FROM events e ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const result = await query(
      `SELECT e.id, e.title, e.description, e.event_type, e.start_datetime, e.end_datetime,
              e.registration_deadline, e.max_participants, e.status, e.is_college_wide,
              e.banner_url, e.qr_code_url,
              d.name as dept_name,
              cl.name as venue_name,
              u.first_name || ' ' || u.last_name as organizer_name,
              COUNT(er.id) as registered_count,
              EXISTS(SELECT 1 FROM event_registrations er2
                     WHERE er2.event_id = e.id AND er2.user_id = $${pi}) as is_registered
       FROM events e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN campus_locations cl ON e.venue_id = cl.id
       LEFT JOIN users u ON e.organized_by = u.id
       LEFT JOIN event_registrations er ON e.id = er.event_id
       ${where}
       GROUP BY e.id, d.name, cl.name, u.first_name, u.last_name
       ORDER BY e.start_datetime
       LIMIT $${pi + 1} OFFSET $${pi + 2}`,
      [...params, req.user!.userId, l, offset]
    );

    sendSuccess(res, result.rows, undefined, 200, buildMeta(Number(page), l, total));
  } catch {
    sendError(res, 'Failed to fetch events', 500);
  }
};

// POST /api/events
export const createEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      title, description, eventType, departmentId, venueId,
      startDatetime, endDatetime, registrationDeadline, maxParticipants, isCollegeWide,
    } = req.body;

    if (!title || !startDatetime || !endDatetime) {
      sendError(res, 'title, startDatetime, endDatetime are required', 400);
      return;
    }

    const result = await query(
      `INSERT INTO events
         (title, description, event_type, department_id, organized_by, venue_id,
          start_datetime, end_datetime, registration_deadline, max_participants, is_college_wide)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [title, description, eventType, departmentId || null, req.user!.userId,
        venueId || null, startDatetime, endDatetime, registrationDeadline || null,
        maxParticipants || null, isCollegeWide || false]
    );

    sendSuccess(res, result.rows[0], 'Event created', 201);
  } catch {
    sendError(res, 'Failed to create event', 500);
  }
};

// POST /api/events/:id/register
export const registerForEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const ev = await query(
      `SELECT id, status, registration_deadline, max_participants,
              (SELECT COUNT(*) FROM event_registrations WHERE event_id = $1) as reg_count
       FROM events WHERE id = $1`,
      [id]
    );
    if (!ev.rows.length) { sendNotFound(res, 'Event'); return; }
    const event = ev.rows[0];

    if (event.status !== 'upcoming') {
      sendError(res, 'Registration is closed for this event', 400); return;
    }
    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      sendError(res, 'Registration deadline has passed', 400); return;
    }
    if (event.max_participants && parseInt(event.reg_count) >= event.max_participants) {
      sendError(res, 'Event is full', 400); return;
    }

    await query(
      `INSERT INTO event_registrations (event_id, user_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [id, req.user!.userId]
    );

    sendSuccess(res, null, 'Registered successfully');
  } catch {
    sendError(res, 'Failed to register', 500);
  }
};

// POST /api/events/:id/attendance/qr
export const markQRAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const targetUser = userId || req.user!.userId;

    const result = await query(
      `UPDATE event_registrations
       SET attendance_marked = TRUE, attendance_marked_at = NOW(), qr_scanned = TRUE
       WHERE event_id = $1 AND user_id = $2
       RETURNING id`,
      [id, targetUser]
    );

    if (!result.rows.length) {
      sendError(res, 'Registration not found', 404); return;
    }

    sendSuccess(res, null, 'Attendance marked');
  } catch {
    sendError(res, 'Failed to mark attendance', 500);
  }
};

// POST /api/events/:id/feedback
export const submitEventFeedback = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rating, feedbackText } = req.body;

    if (!rating) { sendError(res, 'rating is required', 400); return; }

    // Simple sentiment
    const sentiment = rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative';

    await query(
      `INSERT INTO event_feedback (event_id, user_id, rating, feedback_text, ai_sentiment)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (event_id, user_id) DO UPDATE
       SET rating = EXCLUDED.rating, feedback_text = EXCLUDED.feedback_text`,
      [id, req.user!.userId, rating, feedbackText || null, sentiment]
    );

    sendSuccess(res, null, 'Feedback submitted');
  } catch {
    sendError(res, 'Failed to submit feedback', 500);
  }
};

// GET /api/events/:id
export const getEventById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT e.*, d.name as dept_name, cl.name as venue_name,
              u.first_name || ' ' || u.last_name as organizer_name,
              COUNT(er.id) as registered_count,
              COUNT(er.id) FILTER (WHERE er.attendance_marked = TRUE) as attended_count
       FROM events e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN campus_locations cl ON e.venue_id = cl.id
       LEFT JOIN users u ON e.organized_by = u.id
       LEFT JOIN event_registrations er ON e.id = er.event_id
       WHERE e.id = $1
       GROUP BY e.id, d.name, cl.name, u.first_name, u.last_name`,
      [req.params.id]
    );
    if (!result.rows.length) { sendNotFound(res, 'Event'); return; }

    sendSuccess(res, result.rows[0]);
  } catch {
    sendError(res, 'Failed to fetch event', 500);
  }
};

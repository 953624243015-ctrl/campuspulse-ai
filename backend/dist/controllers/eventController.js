"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventById = exports.submitEventFeedback = exports.markQRAttendance = exports.registerForEvent = exports.createEvent = exports.getEvents = void 0;
const pool_1 = require("../db/pool");
const response_1 = require("../utils/response");
// GET /api/events
const getEvents = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, departmentId } = req.query;
        const { limit: l, offset } = (0, response_1.getPagination)(page, limit);
        const conditions = [];
        const params = [];
        let pi = 1;
        if (status) {
            conditions.push(`e.status = $${pi++}`);
            params.push(status);
        }
        if (departmentId) {
            conditions.push(`(e.department_id = $${pi} OR e.is_college_wide = TRUE)`);
            params.push(departmentId);
            pi++;
        }
        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
        const countRes = await (0, pool_1.query)(`SELECT COUNT(*) FROM events e ${where}`, params);
        const total = parseInt(countRes.rows[0].count);
        const result = await (0, pool_1.query)(`SELECT e.id, e.title, e.description, e.event_type, e.start_datetime, e.end_datetime,
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
       LIMIT $${pi + 1} OFFSET $${pi + 2}`, [...params, req.user.userId, l, offset]);
        (0, response_1.sendSuccess)(res, result.rows, undefined, 200, (0, response_1.buildMeta)(Number(page), l, total));
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to fetch events', 500);
    }
};
exports.getEvents = getEvents;
// POST /api/events
const createEvent = async (req, res) => {
    try {
        const { title, description, eventType, departmentId, venueId, startDatetime, endDatetime, registrationDeadline, maxParticipants, isCollegeWide, } = req.body;
        if (!title || !startDatetime || !endDatetime) {
            (0, response_1.sendError)(res, 'title, startDatetime, endDatetime are required', 400);
            return;
        }
        const result = await (0, pool_1.query)(`INSERT INTO events
         (title, description, event_type, department_id, organized_by, venue_id,
          start_datetime, end_datetime, registration_deadline, max_participants, is_college_wide)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`, [title, description, eventType, departmentId || null, req.user.userId,
            venueId || null, startDatetime, endDatetime, registrationDeadline || null,
            maxParticipants || null, isCollegeWide || false]);
        (0, response_1.sendSuccess)(res, result.rows[0], 'Event created', 201);
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to create event', 500);
    }
};
exports.createEvent = createEvent;
// POST /api/events/:id/register
const registerForEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const ev = await (0, pool_1.query)(`SELECT id, status, registration_deadline, max_participants,
              (SELECT COUNT(*) FROM event_registrations WHERE event_id = $1) as reg_count
       FROM events WHERE id = $1`, [id]);
        if (!ev.rows.length) {
            (0, response_1.sendNotFound)(res, 'Event');
            return;
        }
        const event = ev.rows[0];
        if (event.status !== 'upcoming') {
            (0, response_1.sendError)(res, 'Registration is closed for this event', 400);
            return;
        }
        if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
            (0, response_1.sendError)(res, 'Registration deadline has passed', 400);
            return;
        }
        if (event.max_participants && parseInt(event.reg_count) >= event.max_participants) {
            (0, response_1.sendError)(res, 'Event is full', 400);
            return;
        }
        await (0, pool_1.query)(`INSERT INTO event_registrations (event_id, user_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, req.user.userId]);
        (0, response_1.sendSuccess)(res, null, 'Registered successfully');
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to register', 500);
    }
};
exports.registerForEvent = registerForEvent;
// POST /api/events/:id/attendance/qr
const markQRAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const targetUser = userId || req.user.userId;
        const result = await (0, pool_1.query)(`UPDATE event_registrations
       SET attendance_marked = TRUE, attendance_marked_at = NOW(), qr_scanned = TRUE
       WHERE event_id = $1 AND user_id = $2
       RETURNING id`, [id, targetUser]);
        if (!result.rows.length) {
            (0, response_1.sendError)(res, 'Registration not found', 404);
            return;
        }
        (0, response_1.sendSuccess)(res, null, 'Attendance marked');
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to mark attendance', 500);
    }
};
exports.markQRAttendance = markQRAttendance;
// POST /api/events/:id/feedback
const submitEventFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, feedbackText } = req.body;
        if (!rating) {
            (0, response_1.sendError)(res, 'rating is required', 400);
            return;
        }
        // Simple sentiment
        const sentiment = rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative';
        await (0, pool_1.query)(`INSERT INTO event_feedback (event_id, user_id, rating, feedback_text, ai_sentiment)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (event_id, user_id) DO UPDATE
       SET rating = EXCLUDED.rating, feedback_text = EXCLUDED.feedback_text`, [id, req.user.userId, rating, feedbackText || null, sentiment]);
        (0, response_1.sendSuccess)(res, null, 'Feedback submitted');
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to submit feedback', 500);
    }
};
exports.submitEventFeedback = submitEventFeedback;
// GET /api/events/:id
const getEventById = async (req, res) => {
    try {
        const result = await (0, pool_1.query)(`SELECT e.*, d.name as dept_name, cl.name as venue_name,
              u.first_name || ' ' || u.last_name as organizer_name,
              COUNT(er.id) as registered_count,
              COUNT(er.id) FILTER (WHERE er.attendance_marked = TRUE) as attended_count
       FROM events e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN campus_locations cl ON e.venue_id = cl.id
       LEFT JOIN users u ON e.organized_by = u.id
       LEFT JOIN event_registrations er ON e.id = er.event_id
       WHERE e.id = $1
       GROUP BY e.id, d.name, cl.name, u.first_name, u.last_name`, [req.params.id]);
        if (!result.rows.length) {
            (0, response_1.sendNotFound)(res, 'Event');
            return;
        }
        (0, response_1.sendSuccess)(res, result.rows[0]);
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to fetch event', 500);
    }
};
exports.getEventById = getEventById;
//# sourceMappingURL=eventController.js.map
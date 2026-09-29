import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { query } from '../db/pool';
import {
  sendSuccess, sendError, sendNotFound, getPagination, buildMeta,
} from '../utils/response';

const generateTicketNumber = (): string => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TKT-${year}-${rand}`;
};

// POST /api/complaints
export const submitComplaint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { categoryId, locationId, title, description, isAnonymous } = req.body;
    if (!categoryId || !title || !description) {
      sendError(res, 'categoryId, title, description are required', 400);
      return;
    }

    // Simple duplicate detection: same user + same location + same category within 7 days
    const dup = await query(
      `SELECT id FROM complaints
       WHERE submitted_by = $1 AND category_id = $2 AND location_id = $3
       AND created_at > NOW() - INTERVAL '7 days' AND status NOT IN ('resolved','verified','closed')
       LIMIT 1`,
      [req.user!.userId, categoryId, locationId || null]
    );

    // Check if similar complaints exist (cluster detection)
    const clusterCount = await query(
      `SELECT COUNT(*) as cnt FROM complaints
       WHERE category_id = $1 AND location_id = $2
       AND created_at > NOW() - INTERVAL '7 days'`,
      [categoryId, locationId || null]
    );

    const clusterSize = parseInt(clusterCount.rows[0]?.cnt || '0');
    const priority = clusterSize >= 5 ? 'high' : clusterSize >= 3 ? 'medium' : 'medium';
    const isDuplicate = dup.rows.length > 0;
    const parentId = isDuplicate ? dup.rows[0].id : null;

    const ticketNumber = generateTicketNumber();
    const result = await query(
      `INSERT INTO complaints
         (ticket_number, submitted_by, category_id, location_id, title, description,
          priority, is_anonymous, is_duplicate, parent_complaint_id,
          ai_classification)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        ticketNumber, req.user!.userId, categoryId, locationId || null,
        title, description, priority, isAnonymous || false,
        isDuplicate, parentId,
        JSON.stringify({ autoClassified: true, clusterSize }),
      ]
    );

    // If cluster ≥ 5, create AI insight
    if (clusterSize >= 4) {
      await query(
        `INSERT INTO ai_insights (insight_type, target_type, target_id, title, description, severity)
         VALUES ('complaint_cluster', 'location', $1, $2, $3, 'critical')
         ON CONFLICT DO NOTHING`,
        [
          locationId,
          `Recurring Issue Detected – ${clusterSize + 1} reports`,
          `${clusterSize + 1} complaints in this category/location within 7 days. Immediate admin attention recommended.`,
        ]
      );
    }

    sendSuccess(res, {
      ...result.rows[0],
      isDuplicate,
      clusterSize: clusterSize + 1,
    }, isDuplicate ? 'Similar complaint already exists. Linked to existing ticket.' : 'Complaint submitted', 201);
  } catch {
    sendError(res, 'Failed to submit complaint', 500);
  }
};

// GET /api/complaints (admin sees all; others see own)
export const getComplaints = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, priority, categoryId, search } = req.query;
    const { limit: l, offset } = getPagination(page, limit);

    const conditions: string[] = [];
    const params: unknown[] = [];
    let pi = 1;

    // Students only see own complaints
    if (req.user!.role === 'student') {
      conditions.push(`c.submitted_by = $${pi++}`);
      params.push(req.user!.userId);
    }

    if (status) { conditions.push(`c.status = $${pi++}`); params.push(status); }
    if (priority) { conditions.push(`c.priority = $${pi++}`); params.push(priority); }
    if (categoryId) { conditions.push(`c.category_id = $${pi++}`); params.push(categoryId); }
    if (search) {
      conditions.push(`(c.title ILIKE $${pi} OR c.ticket_number ILIKE $${pi})`);
      params.push(`%${search}%`); pi++;
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const countRes = await query(`SELECT COUNT(*) FROM complaints c ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const result = await query(
      `SELECT c.id, c.ticket_number, c.title, c.description, c.status, c.priority,
              c.is_anonymous, c.is_duplicate, c.created_at, c.resolved_at,
              c.ai_classification,
              cc.name as category_name, cc.code as category_code,
              cl.name as location_name, cl.block as location_block,
              CASE WHEN c.is_anonymous THEN 'Anonymous' ELSE u.first_name || ' ' || u.last_name END as submitted_by_name,
              au.first_name || ' ' || au.last_name as assigned_to_name,
              (SELECT COUNT(*) FROM complaints WHERE parent_complaint_id = c.id) as related_count
       FROM complaints c
       LEFT JOIN complaint_categories cc ON c.category_id = cc.id
       LEFT JOIN campus_locations cl ON c.location_id = cl.id
       LEFT JOIN users u ON c.submitted_by = u.id
       LEFT JOIN users au ON c.assigned_to = au.id
       ${where}
       ORDER BY
         CASE c.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
         c.created_at DESC
       LIMIT $${pi++} OFFSET $${pi++}`,
      [...params, l, offset]
    );

    sendSuccess(res, result.rows, undefined, 200, buildMeta(Number(page), l, total));
  } catch {
    sendError(res, 'Failed to fetch complaints', 500);
  }
};

// GET /api/complaints/:id
export const getComplaintById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT c.*, cc.name as category_name, cl.name as location_name,
              CASE WHEN c.is_anonymous THEN 'Anonymous' ELSE u.first_name || ' ' || u.last_name END as submitted_by_name,
              au.first_name || ' ' || au.last_name as assigned_to_name
       FROM complaints c
       LEFT JOIN complaint_categories cc ON c.category_id = cc.id
       LEFT JOIN campus_locations cl ON c.location_id = cl.id
       LEFT JOIN users u ON c.submitted_by = u.id
       LEFT JOIN users au ON c.assigned_to = au.id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) { sendNotFound(res, 'Complaint'); return; }

    const complaint = result.rows[0];
    // Permission check: student can only see own
    if (req.user!.role === 'student' && complaint.submitted_by !== req.user!.userId && !complaint.is_anonymous) {
      sendNotFound(res, 'Complaint'); return;
    }

    // Timeline
    const timeline = await query(
      `SELECT cu.*, u.first_name || ' ' || u.last_name as updated_by_name
       FROM complaint_updates cu
       JOIN users u ON cu.updated_by = u.id
       WHERE cu.complaint_id = $1
       ORDER BY cu.created_at`,
      [req.params.id]
    );

    sendSuccess(res, { ...complaint, timeline: timeline.rows });
  } catch {
    sendError(res, 'Failed to fetch complaint', 500);
  }
};

// PATCH /api/complaints/:id/status
export const updateComplaintStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, assignedTo, message, resolutionNotes } = req.body;
    const { id } = req.params;

    const existing = await query('SELECT * FROM complaints WHERE id = $1', [id]);
    if (!existing.rows.length) { sendNotFound(res, 'Complaint'); return; }
    const old = existing.rows[0];

    await query(
      `UPDATE complaints SET status = COALESCE($1, status),
       assigned_to = COALESCE($2, assigned_to),
       resolution_notes = COALESCE($3, resolution_notes),
       resolved_at = CASE WHEN $1 IN ('resolved','verified') THEN NOW() ELSE resolved_at END,
       updated_at = NOW()
       WHERE id = $4`,
      [status || null, assignedTo || null, resolutionNotes || null, id]
    );

    // Log update
    await query(
      `INSERT INTO complaint_updates (complaint_id, updated_by, old_status, new_status, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, req.user!.userId, old.status, status || old.status, message || null]
    );

    sendSuccess(res, null, 'Complaint updated');
  } catch {
    sendError(res, 'Failed to update complaint', 500);
  }
};

// GET /api/complaints/analytics/summary (admin/hod/principal)
export const getComplaintAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const byCategory = await query(
      `SELECT cc.name, cc.code, COUNT(*) as total,
              COUNT(*) FILTER (WHERE c.status = 'resolved') as resolved,
              COUNT(*) FILTER (WHERE c.status IN ('submitted','assigned','in_progress')) as open,
              ROUND(AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 3600)::numeric, 1) as avg_resolution_hours
       FROM complaints c
       JOIN complaint_categories cc ON c.category_id = cc.id
       GROUP BY cc.name, cc.code ORDER BY total DESC`
    );

    const byLocation = await query(
      `SELECT cl.name, cl.block, COUNT(*) as total
       FROM complaints c
       JOIN campus_locations cl ON c.location_id = cl.id
       GROUP BY cl.name, cl.block ORDER BY total DESC LIMIT 10`
    );

    const byStatus = await query(
      `SELECT status, COUNT(*) as count FROM complaints GROUP BY status`
    );

    const byPriority = await query(
      `SELECT priority, COUNT(*) as count FROM complaints GROUP BY priority`
    );

    const trend = await query(
      `SELECT DATE_TRUNC('week', created_at) as week, COUNT(*) as count
       FROM complaints
       WHERE created_at > NOW() - INTERVAL '12 weeks'
       GROUP BY week ORDER BY week`
    );

    sendSuccess(res, {
      byCategory: byCategory.rows,
      byLocation: byLocation.rows,
      byStatus: byStatus.rows,
      byPriority: byPriority.rows,
      weeklyTrend: trend.rows,
    });
  } catch {
    sendError(res, 'Failed to fetch complaint analytics', 500);
  }
};

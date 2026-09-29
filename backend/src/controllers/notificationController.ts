import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { query } from '../db/pool';
import { sendSuccess, sendError } from '../utils/response';

// GET /api/notifications
export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { isRead, limit = 30 } = req.query;

    let sql = `
      SELECT id, type, title, message, reference_id, reference_type,
             is_read, read_at, action_url, created_at
      FROM notifications
      WHERE user_id = $1
    `;
    const params: unknown[] = [req.user!.userId];

    if (isRead !== undefined) {
      sql += ` AND is_read = $2`;
      params.push(isRead === 'true');
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(sql, params);
    const unreadCount = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [req.user!.userId]
    );

    sendSuccess(res, {
      notifications: result.rows,
      unreadCount: parseInt(unreadCount.rows[0].count),
    });
  } catch {
    sendError(res, 'Failed to fetch notifications', 500);
  }
};

// PATCH /api/notifications/:id/read
export const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await query(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.userId]
    );
    sendSuccess(res, null, 'Marked as read');
  } catch {
    sendError(res, 'Failed to mark notification', 500);
  }
};

// PATCH /api/notifications/read-all
export const markAllAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await query(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = $1 AND is_read = FALSE',
      [req.user!.userId]
    );
    sendSuccess(res, null, 'All notifications marked as read');
  } catch {
    sendError(res, 'Failed to mark notifications', 500);
  }
};

// GET /api/announcements (any authenticated user)
export const getAnnouncements = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT a.id, a.title, a.content, a.is_urgent, a.published_at, a.expires_at,
              a.is_college_wide, a.target_roles, a.attachment_url,
              u.first_name || ' ' || u.last_name as created_by_name, u.role as created_by_role
       FROM announcements a
       JOIN users u ON a.created_by = u.id
       WHERE (a.expires_at IS NULL OR a.expires_at > NOW())
       AND (
         a.is_college_wide = TRUE
         OR $1 = ANY(a.target_roles::text[])
         OR a.created_by = $2
       )
       ORDER BY a.is_urgent DESC, a.published_at DESC
       LIMIT 30`,
      [req.user!.role, req.user!.userId]
    );
    sendSuccess(res, result.rows);
  } catch {
    sendError(res, 'Failed to fetch announcements', 500);
  }
};

// GET /api/emergency-alerts
export const getEmergencyAlerts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT ea.*, u.first_name || ' ' || u.last_name as created_by_name
       FROM emergency_alerts ea
       JOIN users u ON ea.created_by = u.id
       WHERE ea.is_active = TRUE
       ORDER BY ea.created_at DESC LIMIT 10`
    );
    sendSuccess(res, result.rows);
  } catch {
    sendError(res, 'Failed to fetch emergency alerts', 500);
  }
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmergencyAlerts = exports.getAnnouncements = exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const pool_1 = require("../db/pool");
const response_1 = require("../utils/response");
// GET /api/notifications
const getNotifications = async (req, res) => {
    try {
        const { isRead, limit = 30 } = req.query;
        let sql = `
      SELECT id, type, title, message, reference_id, reference_type,
             is_read, read_at, action_url, created_at
      FROM notifications
      WHERE user_id = $1
    `;
        const params = [req.user.userId];
        if (isRead !== undefined) {
            sql += ` AND is_read = $2`;
            params.push(isRead === 'true');
        }
        sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);
        const result = await (0, pool_1.query)(sql, params);
        const unreadCount = await (0, pool_1.query)('SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE', [req.user.userId]);
        (0, response_1.sendSuccess)(res, {
            notifications: result.rows,
            unreadCount: parseInt(unreadCount.rows[0].count),
        });
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to fetch notifications', 500);
    }
};
exports.getNotifications = getNotifications;
// PATCH /api/notifications/:id/read
const markAsRead = async (req, res) => {
    try {
        await (0, pool_1.query)('UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
        (0, response_1.sendSuccess)(res, null, 'Marked as read');
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to mark notification', 500);
    }
};
exports.markAsRead = markAsRead;
// PATCH /api/notifications/read-all
const markAllAsRead = async (req, res) => {
    try {
        await (0, pool_1.query)('UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = $1 AND is_read = FALSE', [req.user.userId]);
        (0, response_1.sendSuccess)(res, null, 'All notifications marked as read');
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to mark notifications', 500);
    }
};
exports.markAllAsRead = markAllAsRead;
// GET /api/announcements (any authenticated user)
const getAnnouncements = async (req, res) => {
    try {
        const result = await (0, pool_1.query)(`SELECT a.id, a.title, a.content, a.is_urgent, a.published_at, a.expires_at,
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
       LIMIT 30`, [req.user.role, req.user.userId]);
        (0, response_1.sendSuccess)(res, result.rows);
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to fetch announcements', 500);
    }
};
exports.getAnnouncements = getAnnouncements;
// GET /api/emergency-alerts
const getEmergencyAlerts = async (req, res) => {
    try {
        const result = await (0, pool_1.query)(`SELECT ea.*, u.first_name || ' ' || u.last_name as created_by_name
       FROM emergency_alerts ea
       JOIN users u ON ea.created_by = u.id
       WHERE ea.is_active = TRUE
       ORDER BY ea.created_at DESC LIMIT 10`);
        (0, response_1.sendSuccess)(res, result.rows);
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to fetch emergency alerts', 500);
    }
};
exports.getEmergencyAlerts = getEmergencyAlerts;
//# sourceMappingURL=notificationController.js.map
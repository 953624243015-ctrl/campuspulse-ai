import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../types';
import { query } from '../db/pool';
import { sendSuccess, sendError, sendNotFound, getPagination, buildMeta } from '../utils/response';

// GET /api/admin/dashboard
export const getAdminDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [users, students, faculty, complaints, events, equipment, openAlerts] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL AND is_active = TRUE'),
      query('SELECT COUNT(*) as count FROM students'),
      query('SELECT COUNT(*) as count FROM faculty'),
      query(`SELECT COUNT(*) as count FROM complaints WHERE status NOT IN ('resolved','verified','closed')`),
      query(`SELECT COUNT(*) as count FROM events WHERE status = 'upcoming'`),
      query(`SELECT COUNT(*) as count FROM equipment WHERE status = 'needs_maintenance'`),
      query('SELECT COUNT(*) as count FROM risk_alerts WHERE is_active = TRUE'),
    ]);

    const recentComplaints = await query(
      `SELECT c.id, c.ticket_number, c.title, c.status, c.priority, c.created_at,
              cc.name as category_name, cl.name as location_name
       FROM complaints c
       LEFT JOIN complaint_categories cc ON c.category_id = cc.id
       LEFT JOIN campus_locations cl ON c.location_id = cl.id
       ORDER BY c.created_at DESC LIMIT 5`
    );

    const maintenanceNeeded = await query(
      `SELECT e.id, e.name, e.asset_tag, e.status,
              ec.name as category_name, cl.name as location_name
       FROM equipment e
       LEFT JOIN equipment_categories ec ON e.category_id = ec.id
       LEFT JOIN campus_locations cl ON e.location_id = cl.id
       WHERE e.status IN ('needs_maintenance','under_maintenance')
       ORDER BY e.next_maintenance_date LIMIT 5`
    );

    sendSuccess(res, {
      stats: {
        totalUsers: parseInt(users.rows[0].count),
        totalStudents: parseInt(students.rows[0].count),
        totalFaculty: parseInt(faculty.rows[0].count),
        openComplaints: parseInt(complaints.rows[0].count),
        upcomingEvents: parseInt(events.rows[0].count),
        maintenanceNeeded: parseInt(equipment.rows[0].count),
        activeRiskAlerts: parseInt(openAlerts.rows[0].count),
      },
      recentComplaints: recentComplaints.rows,
      maintenanceNeeded: maintenanceNeeded.rows,
    });
  } catch {
    sendError(res, 'Failed to fetch admin dashboard', 500);
  }
};

// GET /api/admin/users
export const getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, role, departmentId, search, isActive } = req.query;
    const { limit: l, offset } = getPagination(page, limit);

    const conditions = ['u.deleted_at IS NULL'];
    const params: unknown[] = [];
    let pi = 1;

    if (role) { conditions.push(`u.role = $${pi++}`); params.push(role); }
    if (departmentId) { conditions.push(`u.department_id = $${pi++}`); params.push(departmentId); }
    if (isActive !== undefined) { conditions.push(`u.is_active = $${pi++}`); params.push(isActive === 'true'); }
    if (search) {
      conditions.push(`(u.first_name ILIKE $${pi} OR u.last_name ILIKE $${pi} OR u.email ILIKE $${pi})`);
      params.push(`%${search}%`); pi++;
    }

    const where = 'WHERE ' + conditions.join(' AND ');

    const countRes = await query(`SELECT COUNT(*) FROM users u ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const result = await query(
      `SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone,
              u.is_active, u.is_email_verified, u.last_login, u.created_at,
              d.name as dept_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${pi++} OFFSET $${pi++}`,
      [...params, l, offset]
    );

    sendSuccess(res, result.rows, undefined, 200, buildMeta(Number(page), l, total));
  } catch {
    sendError(res, 'Failed to fetch users', 500);
  }
};

// POST /api/admin/users
export const createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, password, role, firstName, lastName, phone, gender, departmentId } = req.body;
    if (!email || !password || !role || !firstName || !lastName) {
      sendError(res, 'email, password, role, firstName, lastName are required', 400); return;
    }

    const exists = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length) { sendError(res, 'Email already registered', 409); return; }

    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, gender, department_id, is_email_verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE) RETURNING id, email, role, first_name, last_name`,
      [email.toLowerCase(), hash, role, firstName, lastName, phone || null, gender || null, departmentId || null]
    );

    sendSuccess(res, result.rows[0], 'User created', 201);
  } catch {
    sendError(res, 'Failed to create user', 500);
  }
};

// PATCH /api/admin/users/:id
export const updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, phone, isActive, departmentId } = req.body;
    await query(
      `UPDATE users SET
         first_name = COALESCE($1, first_name),
         last_name = COALESCE($2, last_name),
         phone = COALESCE($3, phone),
         is_active = COALESCE($4, is_active),
         department_id = COALESCE($5, department_id),
         updated_at = NOW()
       WHERE id = $6 AND deleted_at IS NULL`,
      [firstName || null, lastName || null, phone || null,
        isActive !== undefined ? isActive : null, departmentId || null, req.params.id]
    );
    sendSuccess(res, null, 'User updated');
  } catch {
    sendError(res, 'Failed to update user', 500);
  }
};

// DELETE /api/admin/users/:id (soft delete)
export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.params.id === req.user!.userId) {
      sendError(res, 'Cannot delete your own account', 400); return;
    }
    await query(
      'UPDATE users SET deleted_at = NOW(), is_active = FALSE WHERE id = $1',
      [req.params.id]
    );
    sendSuccess(res, null, 'User deactivated');
  } catch {
    sendError(res, 'Failed to delete user', 500);
  }
};

// GET /api/admin/equipment
export const getEquipment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, categoryId, locationId } = req.query;
    const { limit: l, offset } = getPagination(page, limit);

    const conditions: string[] = [];
    const params: unknown[] = [];
    let pi = 1;

    if (status) { conditions.push(`e.status = $${pi++}`); params.push(status); }
    if (categoryId) { conditions.push(`e.category_id = $${pi++}`); params.push(categoryId); }
    if (locationId) { conditions.push(`e.location_id = $${pi++}`); params.push(locationId); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const countRes = await query(`SELECT COUNT(*) FROM equipment e ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const result = await query(
      `SELECT e.*, ec.name as category_name, cl.name as location_name
       FROM equipment e
       LEFT JOIN equipment_categories ec ON e.category_id = ec.id
       LEFT JOIN campus_locations cl ON e.location_id = cl.id
       ${where}
       ORDER BY
         CASE e.status WHEN 'needs_maintenance' THEN 1 WHEN 'under_maintenance' THEN 2 ELSE 3 END,
         e.next_maintenance_date
       LIMIT $${pi++} OFFSET $${pi++}`,
      [...params, l, offset]
    );

    sendSuccess(res, result.rows, undefined, 200, buildMeta(Number(page), l, total));
  } catch {
    sendError(res, 'Failed to fetch equipment', 500);
  }
};

// POST /api/admin/equipment/:id/maintenance
export const addMaintenanceRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { maintenanceType, description, performedBy, cost, downtimeHours, issueDate, resolvedDate, partsReplaced } = req.body;
    const { id } = req.params;

    const result = await query(
      `INSERT INTO maintenance_records
         (equipment_id, maintenance_type, description, performed_by, cost, downtime_hours, issue_date, resolved_date, parts_replaced, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [id, maintenanceType, description, performedBy, cost || null,
        downtimeHours || null, issueDate, resolvedDate || null,
        partsReplaced || [], req.user!.userId]
    );

    // Update equipment maintenance dates
    await query(
      `UPDATE equipment SET
         last_maintenance_date = $1,
         next_maintenance_date = $1::date + maintenance_frequency_days * INTERVAL '1 day',
         status = CASE WHEN $2 IS NOT NULL THEN 'operational' ELSE status END,
         updated_at = NOW()
       WHERE id = $3`,
      [resolvedDate || issueDate, resolvedDate, id]
    );

    sendSuccess(res, result.rows[0], 'Maintenance record added', 201);
  } catch {
    sendError(res, 'Failed to add maintenance record', 500);
  }
};

// GET /api/admin/departments
export const getDepartments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT d.*,
              u.first_name || ' ' || u.last_name as hod_name,
              COUNT(DISTINCT s.id) as student_count,
              COUNT(DISTINCT f.id) as faculty_count
       FROM departments d
       LEFT JOIN users u ON d.hod_id = u.id
       LEFT JOIN users su ON su.department_id = d.id AND su.role = 'student'
       LEFT JOIN students s ON s.user_id = su.id
       LEFT JOIN users fu ON fu.department_id = d.id AND fu.role IN ('faculty','hod')
       LEFT JOIN faculty f ON f.user_id = fu.id
       WHERE d.is_active = TRUE
       GROUP BY d.id, u.first_name, u.last_name
       ORDER BY d.name`
    );
    sendSuccess(res, result.rows);
  } catch {
    sendError(res, 'Failed to fetch departments', 500);
  }
};

// GET /api/admin/announcements
export const getAnnouncements = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT a.*, u.first_name || ' ' || u.last_name as created_by_name
       FROM announcements a
       JOIN users u ON a.created_by = u.id
       ORDER BY a.published_at DESC LIMIT 50`
    );
    sendSuccess(res, result.rows);
  } catch {
    sendError(res, 'Failed to fetch announcements', 500);
  }
};

// POST /api/admin/announcements
export const createAnnouncement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, content, targetRoles, isCollegeWide, isUrgent, expiresAt } = req.body;
    if (!title || !content) { sendError(res, 'title and content required', 400); return; }

    const result = await query(
      `INSERT INTO announcements (title, content, created_by, target_roles, is_college_wide, is_urgent, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, content, req.user!.userId, targetRoles || null, isCollegeWide || true,
        isUrgent || false, expiresAt || null]
    );

    sendSuccess(res, result.rows[0], 'Announcement created', 201);
  } catch {
    sendError(res, 'Failed to create announcement', 500);
  }
};

// POST /api/admin/emergency-alert
export const createEmergencyAlert = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, message, alertType, severity, affectedLocations, targetRoles } = req.body;
    if (!title || !message) { sendError(res, 'title and message required', 400); return; }

    const result = await query(
      `INSERT INTO emergency_alerts (title, message, alert_type, severity, created_by, affected_locations, target_roles)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, message, alertType || 'general', severity || 'critical',
        req.user!.userId, affectedLocations || [], targetRoles || null]
    );

    sendSuccess(res, result.rows[0], 'Emergency alert created', 201);
  } catch {
    sendError(res, 'Failed to create emergency alert', 500);
  }
};

// GET /api/admin/sustainability
export const getSustainabilityData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const monthly = await query(
      `SELECT DATE_TRUNC('month', record_date) as month,
              SUM(electricity_kwh) as electricity,
              SUM(water_litres) as water,
              SUM(waste_kg) as waste,
              SUM(recycled_kg) as recycled
       FROM sustainability_records
       WHERE record_date > NOW() - INTERVAL '12 months'
       GROUP BY month ORDER BY month`
    );

    const byDept = await query(
      `SELECT d.name as dept_name, d.code,
              SUM(sr.electricity_kwh) as electricity,
              SUM(sr.water_litres) as water,
              SUM(sr.waste_kg) as waste
       FROM sustainability_records sr
       JOIN departments d ON sr.department_id = d.id
       WHERE sr.record_date > NOW() - INTERVAL '3 months'
       GROUP BY d.name, d.code ORDER BY electricity DESC`
    );

    sendSuccess(res, { monthly: monthly.rows, byDept: byDept.rows });
  } catch {
    sendError(res, 'Failed to fetch sustainability data', 500);
  }
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSustainabilityData = exports.createEmergencyAlert = exports.createAnnouncement = exports.getAnnouncements = exports.getDepartments = exports.addMaintenanceRecord = exports.getEquipment = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUsers = exports.getAdminDashboard = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const pool_1 = require("../db/pool");
const response_1 = require("../utils/response");
// GET /api/admin/dashboard
const getAdminDashboard = async (req, res) => {
    try {
        const [users, students, faculty, complaints, events, equipment, openAlerts] = await Promise.all([
            (0, pool_1.query)('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL AND is_active = TRUE'),
            (0, pool_1.query)('SELECT COUNT(*) as count FROM students'),
            (0, pool_1.query)('SELECT COUNT(*) as count FROM faculty'),
            (0, pool_1.query)(`SELECT COUNT(*) as count FROM complaints WHERE status NOT IN ('resolved','verified','closed')`),
            (0, pool_1.query)(`SELECT COUNT(*) as count FROM events WHERE status = 'upcoming'`),
            (0, pool_1.query)(`SELECT COUNT(*) as count FROM equipment WHERE status = 'needs_maintenance'`),
            (0, pool_1.query)('SELECT COUNT(*) as count FROM risk_alerts WHERE is_active = TRUE'),
        ]);
        const recentComplaints = await (0, pool_1.query)(`SELECT c.id, c.ticket_number, c.title, c.status, c.priority, c.created_at,
              cc.name as category_name, cl.name as location_name
       FROM complaints c
       LEFT JOIN complaint_categories cc ON c.category_id = cc.id
       LEFT JOIN campus_locations cl ON c.location_id = cl.id
       ORDER BY c.created_at DESC LIMIT 5`);
        const maintenanceNeeded = await (0, pool_1.query)(`SELECT e.id, e.name, e.asset_tag, e.status,
              ec.name as category_name, cl.name as location_name
       FROM equipment e
       LEFT JOIN equipment_categories ec ON e.category_id = ec.id
       LEFT JOIN campus_locations cl ON e.location_id = cl.id
       WHERE e.status IN ('needs_maintenance','under_maintenance')
       ORDER BY e.next_maintenance_date LIMIT 5`);
        (0, response_1.sendSuccess)(res, {
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
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to fetch admin dashboard', 500);
    }
};
exports.getAdminDashboard = getAdminDashboard;
// GET /api/admin/users
const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, role, departmentId, search, isActive } = req.query;
        const { limit: l, offset } = (0, response_1.getPagination)(page, limit);
        const conditions = ['u.deleted_at IS NULL'];
        const params = [];
        let pi = 1;
        if (role) {
            conditions.push(`u.role = $${pi++}`);
            params.push(role);
        }
        if (departmentId) {
            conditions.push(`u.department_id = $${pi++}`);
            params.push(departmentId);
        }
        if (isActive !== undefined) {
            conditions.push(`u.is_active = $${pi++}`);
            params.push(isActive === 'true');
        }
        if (search) {
            conditions.push(`(u.first_name ILIKE $${pi} OR u.last_name ILIKE $${pi} OR u.email ILIKE $${pi})`);
            params.push(`%${search}%`);
            pi++;
        }
        const where = 'WHERE ' + conditions.join(' AND ');
        const countRes = await (0, pool_1.query)(`SELECT COUNT(*) FROM users u ${where}`, params);
        const total = parseInt(countRes.rows[0].count);
        const result = await (0, pool_1.query)(`SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone,
              u.is_active, u.is_email_verified, u.last_login, u.created_at,
              d.name as dept_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${pi++} OFFSET $${pi++}`, [...params, l, offset]);
        (0, response_1.sendSuccess)(res, result.rows, undefined, 200, (0, response_1.buildMeta)(Number(page), l, total));
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to fetch users', 500);
    }
};
exports.getUsers = getUsers;
// POST /api/admin/users
const createUser = async (req, res) => {
    try {
        const { email, password, role, firstName, lastName, phone, gender, departmentId } = req.body;
        if (!email || !password || !role || !firstName || !lastName) {
            (0, response_1.sendError)(res, 'email, password, role, firstName, lastName are required', 400);
            return;
        }
        const exists = await (0, pool_1.query)('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (exists.rows.length) {
            (0, response_1.sendError)(res, 'Email already registered', 409);
            return;
        }
        const hash = await bcryptjs_1.default.hash(password, 12);
        const result = await (0, pool_1.query)(`INSERT INTO users (email, password_hash, role, first_name, last_name, phone, gender, department_id, is_email_verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE) RETURNING id, email, role, first_name, last_name`, [email.toLowerCase(), hash, role, firstName, lastName, phone || null, gender || null, departmentId || null]);
        (0, response_1.sendSuccess)(res, result.rows[0], 'User created', 201);
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to create user', 500);
    }
};
exports.createUser = createUser;
// PATCH /api/admin/users/:id
const updateUser = async (req, res) => {
    try {
        const { firstName, lastName, phone, isActive, departmentId } = req.body;
        await (0, pool_1.query)(`UPDATE users SET
         first_name = COALESCE($1, first_name),
         last_name = COALESCE($2, last_name),
         phone = COALESCE($3, phone),
         is_active = COALESCE($4, is_active),
         department_id = COALESCE($5, department_id),
         updated_at = NOW()
       WHERE id = $6 AND deleted_at IS NULL`, [firstName || null, lastName || null, phone || null,
            isActive !== undefined ? isActive : null, departmentId || null, req.params.id]);
        (0, response_1.sendSuccess)(res, null, 'User updated');
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to update user', 500);
    }
};
exports.updateUser = updateUser;
// DELETE /api/admin/users/:id (soft delete)
const deleteUser = async (req, res) => {
    try {
        if (req.params.id === req.user.userId) {
            (0, response_1.sendError)(res, 'Cannot delete your own account', 400);
            return;
        }
        await (0, pool_1.query)('UPDATE users SET deleted_at = NOW(), is_active = FALSE WHERE id = $1', [req.params.id]);
        (0, response_1.sendSuccess)(res, null, 'User deactivated');
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to delete user', 500);
    }
};
exports.deleteUser = deleteUser;
// GET /api/admin/equipment
const getEquipment = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, categoryId, locationId } = req.query;
        const { limit: l, offset } = (0, response_1.getPagination)(page, limit);
        const conditions = [];
        const params = [];
        let pi = 1;
        if (status) {
            conditions.push(`e.status = $${pi++}`);
            params.push(status);
        }
        if (categoryId) {
            conditions.push(`e.category_id = $${pi++}`);
            params.push(categoryId);
        }
        if (locationId) {
            conditions.push(`e.location_id = $${pi++}`);
            params.push(locationId);
        }
        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
        const countRes = await (0, pool_1.query)(`SELECT COUNT(*) FROM equipment e ${where}`, params);
        const total = parseInt(countRes.rows[0].count);
        const result = await (0, pool_1.query)(`SELECT e.*, ec.name as category_name, cl.name as location_name
       FROM equipment e
       LEFT JOIN equipment_categories ec ON e.category_id = ec.id
       LEFT JOIN campus_locations cl ON e.location_id = cl.id
       ${where}
       ORDER BY
         CASE e.status WHEN 'needs_maintenance' THEN 1 WHEN 'under_maintenance' THEN 2 ELSE 3 END,
         e.next_maintenance_date
       LIMIT $${pi++} OFFSET $${pi++}`, [...params, l, offset]);
        (0, response_1.sendSuccess)(res, result.rows, undefined, 200, (0, response_1.buildMeta)(Number(page), l, total));
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to fetch equipment', 500);
    }
};
exports.getEquipment = getEquipment;
// POST /api/admin/equipment/:id/maintenance
const addMaintenanceRecord = async (req, res) => {
    try {
        const { maintenanceType, description, performedBy, cost, downtimeHours, issueDate, resolvedDate, partsReplaced } = req.body;
        const { id } = req.params;
        const result = await (0, pool_1.query)(`INSERT INTO maintenance_records
         (equipment_id, maintenance_type, description, performed_by, cost, downtime_hours, issue_date, resolved_date, parts_replaced, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`, [id, maintenanceType, description, performedBy, cost || null,
            downtimeHours || null, issueDate, resolvedDate || null,
            partsReplaced || [], req.user.userId]);
        // Update equipment maintenance dates
        await (0, pool_1.query)(`UPDATE equipment SET
         last_maintenance_date = $1,
         next_maintenance_date = $1::date + maintenance_frequency_days * INTERVAL '1 day',
         status = CASE WHEN $2 IS NOT NULL THEN 'operational' ELSE status END,
         updated_at = NOW()
       WHERE id = $3`, [resolvedDate || issueDate, resolvedDate, id]);
        (0, response_1.sendSuccess)(res, result.rows[0], 'Maintenance record added', 201);
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to add maintenance record', 500);
    }
};
exports.addMaintenanceRecord = addMaintenanceRecord;
// GET /api/admin/departments
const getDepartments = async (req, res) => {
    try {
        const result = await (0, pool_1.query)(`SELECT d.*,
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
       ORDER BY d.name`);
        (0, response_1.sendSuccess)(res, result.rows);
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to fetch departments', 500);
    }
};
exports.getDepartments = getDepartments;
// GET /api/admin/announcements
const getAnnouncements = async (req, res) => {
    try {
        const result = await (0, pool_1.query)(`SELECT a.*, u.first_name || ' ' || u.last_name as created_by_name
       FROM announcements a
       JOIN users u ON a.created_by = u.id
       ORDER BY a.published_at DESC LIMIT 50`);
        (0, response_1.sendSuccess)(res, result.rows);
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to fetch announcements', 500);
    }
};
exports.getAnnouncements = getAnnouncements;
// POST /api/admin/announcements
const createAnnouncement = async (req, res) => {
    try {
        const { title, content, targetRoles, isCollegeWide, isUrgent, expiresAt } = req.body;
        if (!title || !content) {
            (0, response_1.sendError)(res, 'title and content required', 400);
            return;
        }
        const result = await (0, pool_1.query)(`INSERT INTO announcements (title, content, created_by, target_roles, is_college_wide, is_urgent, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [title, content, req.user.userId, targetRoles || null, isCollegeWide || true,
            isUrgent || false, expiresAt || null]);
        (0, response_1.sendSuccess)(res, result.rows[0], 'Announcement created', 201);
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to create announcement', 500);
    }
};
exports.createAnnouncement = createAnnouncement;
// POST /api/admin/emergency-alert
const createEmergencyAlert = async (req, res) => {
    try {
        const { title, message, alertType, severity, affectedLocations, targetRoles } = req.body;
        if (!title || !message) {
            (0, response_1.sendError)(res, 'title and message required', 400);
            return;
        }
        const result = await (0, pool_1.query)(`INSERT INTO emergency_alerts (title, message, alert_type, severity, created_by, affected_locations, target_roles)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [title, message, alertType || 'general', severity || 'critical',
            req.user.userId, affectedLocations || [], targetRoles || null]);
        (0, response_1.sendSuccess)(res, result.rows[0], 'Emergency alert created', 201);
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to create emergency alert', 500);
    }
};
exports.createEmergencyAlert = createEmergencyAlert;
// GET /api/admin/sustainability
const getSustainabilityData = async (req, res) => {
    try {
        const monthly = await (0, pool_1.query)(`SELECT DATE_TRUNC('month', record_date) as month,
              SUM(electricity_kwh) as electricity,
              SUM(water_litres) as water,
              SUM(waste_kg) as waste,
              SUM(recycled_kg) as recycled
       FROM sustainability_records
       WHERE record_date > NOW() - INTERVAL '12 months'
       GROUP BY month ORDER BY month`);
        const byDept = await (0, pool_1.query)(`SELECT d.name as dept_name, d.code,
              SUM(sr.electricity_kwh) as electricity,
              SUM(sr.water_litres) as water,
              SUM(sr.waste_kg) as waste
       FROM sustainability_records sr
       JOIN departments d ON sr.department_id = d.id
       WHERE sr.record_date > NOW() - INTERVAL '3 months'
       GROUP BY d.name, d.code ORDER BY electricity DESC`);
        (0, response_1.sendSuccess)(res, { monthly: monthly.rows, byDept: byDept.rows });
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to fetch sustainability data', 500);
    }
};
exports.getSustainabilityData = getSustainabilityData;
//# sourceMappingURL=adminController.js.map
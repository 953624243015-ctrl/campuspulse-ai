"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.getMe = exports.logout = exports.refreshToken = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const pool_1 = require("../db/pool");
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            (0, response_1.sendError)(res, 'Email and password are required', 400);
            return;
        }
        const result = await (0, pool_1.query)(`SELECT u.id, u.email, u.password_hash, u.role, u.first_name, u.last_name,
              u.department_id, u.is_active, u.profile_image_url
       FROM users u
       WHERE u.email = $1 AND u.deleted_at IS NULL`, [email.toLowerCase().trim()]);
        if (result.rows.length === 0) {
            (0, response_1.sendError)(res, 'Invalid email or password', 401);
            return;
        }
        const user = result.rows[0];
        if (!user.is_active) {
            (0, response_1.sendError)(res, 'Account is deactivated. Contact admin.', 401);
            return;
        }
        const passwordValid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!passwordValid) {
            (0, response_1.sendError)(res, 'Invalid email or password', 401);
            return;
        }
        // Update last login
        await (0, pool_1.query)('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            departmentId: user.department_id,
        };
        const accessToken = (0, jwt_1.signAccessToken)(payload);
        const refreshToken = (0, jwt_1.signRefreshToken)(payload);
        // Store hashed refresh token
        const tokenHash = crypto_1.default.createHash('sha256').update(refreshToken).digest('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await (0, pool_1.query)('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [user.id, tokenHash, expiresAt]);
        (0, response_1.sendSuccess)(res, {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                firstName: user.first_name,
                lastName: user.last_name,
                departmentId: user.department_id,
                profileImageUrl: user.profile_image_url,
            },
        }, 'Login successful');
    }
    catch (err) {
        (0, response_1.sendError)(res, 'Login failed', 500);
    }
};
exports.login = login;
const refreshToken = async (req, res) => {
    try {
        const { refreshToken: token } = req.body;
        if (!token) {
            (0, response_1.sendError)(res, 'Refresh token required', 400);
            return;
        }
        const payload = (0, jwt_1.verifyRefreshToken)(token);
        const tokenHash = crypto_1.default.createHash('sha256').update(token).digest('hex');
        const result = await (0, pool_1.query)('SELECT id FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()', [tokenHash]);
        if (result.rows.length === 0) {
            (0, response_1.sendUnauthorized)(res, 'Refresh token invalid or expired');
            return;
        }
        const newPayload = {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            departmentId: payload.departmentId,
        };
        const newAccessToken = (0, jwt_1.signAccessToken)(newPayload);
        const newRefreshToken = (0, jwt_1.signRefreshToken)(newPayload);
        // Rotate refresh token
        await (0, pool_1.query)('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
        const newHash = crypto_1.default.createHash('sha256').update(newRefreshToken).digest('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await (0, pool_1.query)('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [payload.userId, newHash, expiresAt]);
        (0, response_1.sendSuccess)(res, { accessToken: newAccessToken, refreshToken: newRefreshToken });
    }
    catch {
        (0, response_1.sendUnauthorized)(res, 'Invalid refresh token');
    }
};
exports.refreshToken = refreshToken;
const logout = async (req, res) => {
    try {
        const { refreshToken: token } = req.body;
        if (token) {
            const tokenHash = crypto_1.default.createHash('sha256').update(token).digest('hex');
            await (0, pool_1.query)('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
        }
        (0, response_1.sendSuccess)(res, null, 'Logged out successfully');
    }
    catch {
        (0, response_1.sendError)(res, 'Logout failed', 500);
    }
};
exports.logout = logout;
const getMe = async (req, res) => {
    try {
        const result = await (0, pool_1.query)(`SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone,
              u.gender, u.profile_image_url, u.department_id, u.is_active,
              u.last_login, u.created_at,
              d.name as department_name, d.code as department_code
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1 AND u.deleted_at IS NULL`, [req.user.userId]);
        if (result.rows.length === 0) {
            (0, response_1.sendError)(res, 'User not found', 404);
            return;
        }
        const u = result.rows[0];
        // If student, also get student profile
        let profile = null;
        if (u.role === 'student') {
            const sp = await (0, pool_1.query)(`SELECT s.*, sec.name as section_name, b.name as batch_name
         FROM students s
         LEFT JOIN sections sec ON s.section_id = sec.id
         LEFT JOIN batches b ON s.batch_id = b.id
         WHERE s.user_id = $1`, [u.id]);
            profile = sp.rows[0] || null;
        }
        else if (u.role === 'faculty' || u.role === 'mentor' || u.role === 'hod') {
            const fp = await (0, pool_1.query)('SELECT * FROM faculty WHERE user_id = $1', [u.id]);
            profile = fp.rows[0] || null;
        }
        (0, response_1.sendSuccess)(res, {
            id: u.id,
            email: u.email,
            role: u.role,
            firstName: u.first_name,
            lastName: u.last_name,
            phone: u.phone,
            gender: u.gender,
            profileImageUrl: u.profile_image_url,
            departmentId: u.department_id,
            departmentName: u.department_name,
            departmentCode: u.department_code,
            isActive: u.is_active,
            lastLogin: u.last_login,
            createdAt: u.created_at,
            profile,
        });
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to fetch user', 500);
    }
};
exports.getMe = getMe;
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            (0, response_1.sendError)(res, 'Both current and new password are required', 400);
            return;
        }
        if (newPassword.length < 8) {
            (0, response_1.sendError)(res, 'Password must be at least 8 characters', 400);
            return;
        }
        const result = await (0, pool_1.query)('SELECT password_hash FROM users WHERE id = $1', [req.user.userId]);
        const user = result.rows[0];
        const valid = await bcryptjs_1.default.compare(currentPassword, user.password_hash);
        if (!valid) {
            (0, response_1.sendError)(res, 'Current password is incorrect', 401);
            return;
        }
        const newHash = await bcryptjs_1.default.hash(newPassword, 12);
        await (0, pool_1.query)('UPDATE users SET password_hash = $1, password_changed_at = NOW() WHERE id = $2', [newHash, req.user.userId]);
        // Invalidate all refresh tokens
        await (0, pool_1.query)('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user.userId]);
        (0, response_1.sendSuccess)(res, null, 'Password changed successfully');
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to change password', 500);
    }
};
exports.changePassword = changePassword;
//# sourceMappingURL=authController.js.map
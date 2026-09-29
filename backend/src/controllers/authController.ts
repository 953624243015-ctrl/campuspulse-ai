import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../db/pool';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendSuccess, sendError, sendUnauthorized } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      sendError(res, 'Email and password are required', 400);
      return;
    }

    const result = await query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.first_name, u.last_name,
              u.department_id, u.is_active, u.profile_image_url
       FROM users u
       WHERE u.email = $1 AND u.deleted_at IS NULL`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    const user = result.rows[0];

    if (!user.is_active) {
      sendError(res, 'Account is deactivated. Contact admin.', 401);
      return;
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.department_id,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Store hashed refresh token
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokenHash, expiresAt]
    );

    sendSuccess(res, {
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
  } catch (err) {
    sendError(res, 'Login failed', 500);
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      sendError(res, 'Refresh token required', 400);
      return;
    }

    const payload = verifyRefreshToken(token);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await query(
      'SELECT id FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()',
      [tokenHash]
    );

    if (result.rows.length === 0) {
      sendUnauthorized(res, 'Refresh token invalid or expired');
      return;
    }

    const newPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      departmentId: payload.departmentId,
    };

    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    // Rotate refresh token
    await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
    const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [payload.userId, newHash, expiresAt]
    );

    sendSuccess(res, { accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    sendUnauthorized(res, 'Invalid refresh token');
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
    }
    sendSuccess(res, null, 'Logged out successfully');
  } catch {
    sendError(res, 'Logout failed', 500);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone,
              u.gender, u.profile_image_url, u.department_id, u.is_active,
              u.last_login, u.created_at,
              d.name as department_name, d.code as department_code
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      sendError(res, 'User not found', 404);
      return;
    }

    const u = result.rows[0];

    // If student, also get student profile
    let profile = null;
    if (u.role === 'student') {
      const sp = await query(
        `SELECT s.*, sec.name as section_name, b.name as batch_name
         FROM students s
         LEFT JOIN sections sec ON s.section_id = sec.id
         LEFT JOIN batches b ON s.batch_id = b.id
         WHERE s.user_id = $1`,
        [u.id]
      );
      profile = sp.rows[0] || null;
    } else if (u.role === 'faculty' || u.role === 'mentor' || u.role === 'hod') {
      const fp = await query('SELECT * FROM faculty WHERE user_id = $1', [u.id]);
      profile = fp.rows[0] || null;
    }

    sendSuccess(res, {
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
  } catch {
    sendError(res, 'Failed to fetch user', 500);
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      sendError(res, 'Both current and new password are required', 400);
      return;
    }
    if (newPassword.length < 8) {
      sendError(res, 'Password must be at least 8 characters', 400);
      return;
    }

    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user!.userId]);
    const user = result.rows[0];
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      sendError(res, 'Current password is incorrect', 401);
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await query(
      'UPDATE users SET password_hash = $1, password_changed_at = NOW() WHERE id = $2',
      [newHash, req.user!.userId]
    );

    // Invalidate all refresh tokens
    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user!.userId]);

    sendSuccess(res, null, 'Password changed successfully');
  } catch {
    sendError(res, 'Failed to change password', 500);
  }
};

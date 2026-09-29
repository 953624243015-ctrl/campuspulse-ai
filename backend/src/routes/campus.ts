import { Router } from 'express';
import { query } from '../db/pool';
import { sendSuccess, sendError } from '../utils/response';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { Response } from 'express';

const router = Router();

// GET /api/campus/locations – campus map data
router.get('/locations', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, block, search } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let pi = 1;

    if (type) { conditions.push(`type = $${pi++}`); params.push(type); }
    if (block) { conditions.push(`block = $${pi++}`); params.push(block); }
    if (search) {
      conditions.push(`(name ILIKE $${pi} OR code ILIKE $${pi})`);
      params.push(`%${search}%`); pi++;
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const result = await query(`SELECT * FROM campus_locations ${where} ORDER BY block, name`, params);
    sendSuccess(res, result.rows);
  } catch {
    sendError(res, 'Failed to fetch locations', 500);
  }
});

// GET /api/campus/locations/:id
router.get('/locations/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query('SELECT * FROM campus_locations WHERE id = $1', [req.params.id]);
    if (!result.rows.length) { sendError(res, 'Location not found', 404); return; }
    sendSuccess(res, result.rows[0]);
  } catch {
    sendError(res, 'Failed to fetch location', 500);
  }
});

// GET /api/campus/departments
router.get('/departments', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT d.id, d.name, d.code, d.description, d.established_year,
              u.first_name || ' ' || u.last_name as hod_name
       FROM departments d
       LEFT JOIN users u ON d.hod_id = u.id
       WHERE d.is_active = TRUE ORDER BY d.name`
    );
    sendSuccess(res, result.rows);
  } catch {
    sendError(res, 'Failed to fetch departments', 500);
  }
});

export default router;

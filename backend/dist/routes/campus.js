"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pool_1 = require("../db/pool");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/campus/locations – campus map data
router.get('/locations', auth_1.authenticate, async (req, res) => {
    try {
        const { type, block, search } = req.query;
        const conditions = [];
        const params = [];
        let pi = 1;
        if (type) {
            conditions.push(`type = $${pi++}`);
            params.push(type);
        }
        if (block) {
            conditions.push(`block = $${pi++}`);
            params.push(block);
        }
        if (search) {
            conditions.push(`(name ILIKE $${pi} OR code ILIKE $${pi})`);
            params.push(`%${search}%`);
            pi++;
        }
        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
        const result = await (0, pool_1.query)(`SELECT * FROM campus_locations ${where} ORDER BY block, name`, params);
        (0, response_1.sendSuccess)(res, result.rows);
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to fetch locations', 500);
    }
});
// GET /api/campus/locations/:id
router.get('/locations/:id', auth_1.authenticate, async (req, res) => {
    try {
        const result = await (0, pool_1.query)('SELECT * FROM campus_locations WHERE id = $1', [req.params.id]);
        if (!result.rows.length) {
            (0, response_1.sendError)(res, 'Location not found', 404);
            return;
        }
        (0, response_1.sendSuccess)(res, result.rows[0]);
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to fetch location', 500);
    }
});
// GET /api/campus/departments
router.get('/departments', auth_1.authenticate, async (req, res) => {
    try {
        const result = await (0, pool_1.query)(`SELECT d.id, d.name, d.code, d.description, d.established_year,
              u.first_name || ' ' || u.last_name as hod_name
       FROM departments d
       LEFT JOIN users u ON d.hod_id = u.id
       WHERE d.is_active = TRUE ORDER BY d.name`);
        (0, response_1.sendSuccess)(res, result.rows);
    }
    catch {
        (0, response_1.sendError)(res, 'Failed to fetch departments', 500);
    }
});
exports.default = router;
//# sourceMappingURL=campus.js.map
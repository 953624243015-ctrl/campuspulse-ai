"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = void 0;
const pool_1 = require("../db/pool");
const auditLog = (action, resourceType) => async (req, res, next) => {
    // capture original json to log after response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        // log asynchronously, don't block the response
        if (req.user) {
            (0, pool_1.query)(`INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, details)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                req.user.userId,
                action,
                resourceType || null,
                req.params.id || null,
                req.ip,
                req.get('user-agent'),
                JSON.stringify({ method: req.method, path: req.path }),
            ]).catch(() => { });
        }
        return originalJson(body);
    };
    next();
};
exports.auditLog = auditLog;
//# sourceMappingURL=auditLog.js.map
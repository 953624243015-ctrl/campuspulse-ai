"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMeta = exports.getPagination = exports.sendValidationError = exports.sendForbidden = exports.sendUnauthorized = exports.sendNotFound = exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message, statusCode = 200, meta) => {
    const response = { success: true, data, message, meta };
    return res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, error, statusCode = 500, message) => {
    const response = { success: false, error, message };
    return res.status(statusCode).json(response);
};
exports.sendError = sendError;
const sendNotFound = (res, resource = 'Resource') => (0, exports.sendError)(res, `${resource} not found`, 404);
exports.sendNotFound = sendNotFound;
const sendUnauthorized = (res, message = 'Unauthorized') => (0, exports.sendError)(res, message, 401);
exports.sendUnauthorized = sendUnauthorized;
const sendForbidden = (res, message = 'Access denied') => (0, exports.sendError)(res, message, 403);
exports.sendForbidden = sendForbidden;
const sendValidationError = (res, errors) => res.status(422).json({ success: false, error: 'Validation failed', details: errors });
exports.sendValidationError = sendValidationError;
const getPagination = (page = 1, limit = 20) => {
    const p = Math.max(1, parseInt(String(page), 10));
    const l = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
    return { page: p, limit: l, offset: (p - 1) * l };
};
exports.getPagination = getPagination;
const buildMeta = (page, limit, total) => ({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
});
exports.buildMeta = buildMeta;
//# sourceMappingURL=response.js.map
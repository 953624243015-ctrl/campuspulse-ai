"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeStudentSelf = exports.authorize = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            (0, response_1.sendUnauthorized)(res, 'No token provided');
            return;
        }
        const token = authHeader.split(' ')[1];
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = payload;
        next();
    }
    catch {
        (0, response_1.sendUnauthorized)(res, 'Invalid or expired token');
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => (req, res, next) => {
    if (!req.user) {
        (0, response_1.sendUnauthorized)(res);
        return;
    }
    if (!roles.includes(req.user.role)) {
        (0, response_1.sendForbidden)(res, 'You do not have permission to access this resource');
        return;
    }
    next();
};
exports.authorize = authorize;
// Allow access only to the student's own data OR staff roles
const authorizeStudentSelf = (req, res, next) => {
    if (!req.user) {
        (0, response_1.sendUnauthorized)(res);
        return;
    }
    const staffRoles = ['faculty', 'mentor', 'hod', 'admin', 'principal'];
    if (staffRoles.includes(req.user.role)) {
        next();
        return;
    }
    // student can only view their own data
    const targetUserId = req.params.userId || req.params.id;
    if (req.user.userId === targetUserId || req.user.role === 'student') {
        next();
        return;
    }
    (0, response_1.sendForbidden)(res);
};
exports.authorizeStudentSelf = authorizeStudentSelf;
//# sourceMappingURL=auth.js.map
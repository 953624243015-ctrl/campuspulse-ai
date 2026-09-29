import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { verifyAccessToken } from '../utils/jwt';
import { sendUnauthorized, sendForbidden } from '../utils/response';

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      sendUnauthorized(res, 'No token provided');
      return;
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    sendUnauthorized(res, 'Invalid or expired token');
  }
};

export const authorize = (...roles: UserRole[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendForbidden(res, 'You do not have permission to access this resource');
      return;
    }
    next();
  };

// Allow access only to the student's own data OR staff roles
export const authorizeStudentSelf = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    sendUnauthorized(res);
    return;
  }
  const staffRoles: UserRole[] = ['faculty', 'mentor', 'hod', 'admin', 'principal'];
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
  sendForbidden(res);
};

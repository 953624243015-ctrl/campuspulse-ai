import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { query } from '../db/pool';

export const auditLog = (action: string, resourceType?: string) =>
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    // capture original json to log after response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // log asynchronously, don't block the response
      if (req.user) {
        query(
          `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, details)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            req.user.userId,
            action,
            resourceType || null,
            req.params.id || null,
            req.ip,
            req.get('user-agent'),
            JSON.stringify({ method: req.method, path: req.path }),
          ]
        ).catch(() => {/* silent */});
      }
      return originalJson(body);
    };
    next();
  };

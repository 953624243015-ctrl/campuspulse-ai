import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const auditLog: (action: string, resourceType?: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auditLog.d.ts.map
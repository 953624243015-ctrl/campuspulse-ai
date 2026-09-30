import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const getPrincipalDashboard: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getCampusAnalytics: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const runWhatIfSimulation: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const acknowledgeInsight: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=principalController.d.ts.map
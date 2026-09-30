import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const submitComplaint: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getComplaints: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getComplaintById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateComplaintStatus: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getComplaintAnalytics: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=complaintController.d.ts.map
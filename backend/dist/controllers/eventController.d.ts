import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const getEvents: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createEvent: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const registerForEvent: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const markQRAttendance: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const submitEventFeedback: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getEventById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=eventController.d.ts.map
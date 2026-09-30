import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const getNotifications: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const markAsRead: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const markAllAsRead: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAnnouncements: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getEmergencyAlerts: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=notificationController.d.ts.map
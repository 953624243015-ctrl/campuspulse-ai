import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const getAdminDashboard: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getUsers: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createUser: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateUser: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteUser: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getEquipment: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const addMaintenanceRecord: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getDepartments: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAnnouncements: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createAnnouncement: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createEmergencyAlert: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getSustainabilityData: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=adminController.d.ts.map
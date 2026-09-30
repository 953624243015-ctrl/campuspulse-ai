import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const getFacultyDashboard: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getMyStudents: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createAttendanceSession: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const markAttendance: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getMyMentees: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createMentoringSession: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createAssignment: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAtRiskStudents: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const acknowledgeRiskAlert: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getWorkloadAnalytics: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=facultyController.d.ts.map
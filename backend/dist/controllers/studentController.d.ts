import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const getMyProfile: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getMyAttendance: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getMyMarks: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getMyAssignments: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getMyTimetable: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getMySkills: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getMyDashboard: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const listStudents: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getStudentDigitalTwin: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=studentController.d.ts.map
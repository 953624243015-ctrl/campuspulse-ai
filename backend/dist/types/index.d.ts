import { Request } from 'express';
export type UserRole = 'student' | 'faculty' | 'mentor' | 'hod' | 'admin' | 'principal';
export interface JwtPayload {
    userId: string;
    email: string;
    role: UserRole;
    departmentId?: string;
}
export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}
export interface PaginationParams {
    page: number;
    limit: number;
    offset: number;
}
export interface User {
    id: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    phone?: string;
    gender?: string;
    profileImageUrl?: string;
    departmentId?: string;
    isActive: boolean;
    isEmailVerified: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface Student {
    id: string;
    userId: string;
    rollNumber: string;
    registerNumber?: string;
    batchId?: string;
    sectionId?: string;
    currentSemester: number;
    admissionDate?: Date;
    isHosteler: boolean;
}
export interface Faculty {
    id: string;
    userId: string;
    employeeId: string;
    designation?: string;
    qualification?: string;
    specialization?: string;
    joiningDate?: Date;
    experienceYears: number;
    isMentor: boolean;
}
export interface Department {
    id: string;
    name: string;
    code: string;
    description?: string;
    establishedYear?: number;
    hodId?: string;
    isActive: boolean;
}
export interface AttendanceStats {
    totalClasses: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendancePercentage: number;
}
export interface RiskIndicator {
    studentId: string;
    riskLevel: 'low' | 'moderate' | 'high';
    riskFactors: {
        attendancePct: number;
        avgMarks: number;
        assignmentsMissed: number;
        trend: string;
        weeksAnalyzed: number;
    };
    recommendation: string;
}
//# sourceMappingURL=index.d.ts.map
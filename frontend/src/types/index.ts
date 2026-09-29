export type UserRole = 'student' | 'faculty' | 'mentor' | 'hod' | 'admin' | 'principal';

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
  departmentName?: string;
  departmentCode?: string;
  isActive: boolean;
  lastLogin?: string;
  profile?: StudentProfile | FacultyProfile;
}

export interface StudentProfile {
  id: string;
  rollNumber: string;
  registerNumber?: string;
  currentSemester: number;
  sectionName?: string;
  batchName?: string;
  isHosteler: boolean;
}

export interface FacultyProfile {
  id: string;
  employeeId: string;
  designation?: string;
  qualification?: string;
  isMentor: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AttendanceSubject {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  attendancePct: number;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  subjectName: string;
  subjectCode: string;
  facultyName: string;
  dueDate: string;
  maxMarks: number;
  status: 'published' | 'draft' | 'closed';
  submissionId?: string;
  submittedAt?: string;
  marksObtained?: number;
  submissionStatus?: string;
  feedback?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  eventType: string;
  startDatetime: string;
  endDatetime: string;
  registrationDeadline?: string;
  maxParticipants?: number;
  status: string;
  isCollegeWide: boolean;
  deptName?: string;
  venueName?: string;
  organizerName?: string;
  registeredCount: number;
  isRegistered: boolean;
  bannerUrl?: string;
}

export interface Complaint {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  categoryName: string;
  categoryCode: string;
  locationName?: string;
  locationBlock?: string;
  submittedByName: string;
  assignedToName?: string;
  createdAt: string;
  resolvedAt?: string;
  aiClassification?: Record<string, unknown>;
  relatedCount?: number;
  isAnonymous: boolean;
}

export interface RiskAlert {
  alertId: string;
  riskLevel: 'low' | 'moderate' | 'high';
  riskFactors: {
    attendancePct: number;
    avgMarks: number;
    assignmentsMissed: number;
    trend: string;
    weeksAnalyzed: number;
  };
  recommendation: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  studentId: string;
  sectionName?: string;
  generatedAt: string;
  acknowledgedAt?: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface AIInsight {
  id: string;
  insightType: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  isAcknowledged: boolean;
  generatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  hodName?: string;
  studentCount?: number;
  facultyCount?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

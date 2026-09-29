import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: attach access token ─────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: refresh token on 401 ───────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);
        processQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Show error toast for non-auth errors
    const message = error.response?.data?.error || error.message || 'Something went wrong';
    if (error.response?.status !== 401 && error.response?.status !== 403) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;

// ─── Typed helper wrappers ────────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  getMe: () => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/auth/change-password', { currentPassword, newPassword }),
};

export const studentAPI = {
  getDashboard: () => api.get('/students/me/dashboard'),
  getProfile: () => api.get('/students/me/profile'),
  getAttendance: (params?: Record<string, unknown>) =>
    api.get('/students/me/attendance', { params }),
  getMarks: (params?: Record<string, unknown>) =>
    api.get('/students/me/marks', { params }),
  getAssignments: () => api.get('/students/me/assignments'),
  getTimetable: () => api.get('/students/me/timetable'),
  getSkills: () => api.get('/students/me/skills'),
  listStudents: (params?: Record<string, unknown>) =>
    api.get('/students', { params }),
  getDigitalTwin: (studentId: string) =>
    api.get(`/students/${studentId}/digital-twin`),
};

export const facultyAPI = {
  getDashboard: () => api.get('/faculty/me/dashboard'),
  getStudents: () => api.get('/faculty/me/students'),
  getMentees: () => api.get('/faculty/me/mentees'),
  getAtRiskStudents: () => api.get('/faculty/me/at-risk-students'),
  getWorkload: () => api.get('/faculty/me/workload'),
  createAttendanceSession: (data: Record<string, unknown>) =>
    api.post('/faculty/attendance/session', data),
  markAttendance: (data: Record<string, unknown>) =>
    api.post('/faculty/attendance/mark', data),
  createMentoringSession: (data: Record<string, unknown>) =>
    api.post('/faculty/mentoring/session', data),
  createAssignment: (data: Record<string, unknown>) =>
    api.post('/faculty/assignments', data),
  acknowledgeAlert: (alertId: string, notes?: string) =>
    api.patch(`/faculty/risk-alerts/${alertId}/acknowledge`, { followUpNotes: notes }),
};

export const complaintAPI = {
  submit: (data: Record<string, unknown>) => api.post('/complaints', data),
  list: (params?: Record<string, unknown>) => api.get('/complaints', { params }),
  getById: (id: string) => api.get(`/complaints/${id}`),
  updateStatus: (id: string, data: Record<string, unknown>) =>
    api.patch(`/complaints/${id}/status`, data),
  getAnalytics: () => api.get('/complaints/analytics/summary'),
};

export const eventAPI = {
  list: (params?: Record<string, unknown>) => api.get('/events', { params }),
  getById: (id: string) => api.get(`/events/${id}`),
  create: (data: Record<string, unknown>) => api.post('/events', data),
  register: (id: string) => api.post(`/events/${id}/register`),
  submitFeedback: (id: string, data: Record<string, unknown>) =>
    api.post(`/events/${id}/feedback`, data),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  createUser: (data: Record<string, unknown>) => api.post('/admin/users', data),
  updateUser: (id: string, data: Record<string, unknown>) =>
    api.patch(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getDepartments: () => api.get('/admin/departments'),
  getEquipment: (params?: Record<string, unknown>) =>
    api.get('/admin/equipment', { params }),
  addMaintenance: (equipmentId: string, data: Record<string, unknown>) =>
    api.post(`/admin/equipment/${equipmentId}/maintenance`, data),
  getAnnouncements: () => api.get('/admin/announcements'),
  createAnnouncement: (data: Record<string, unknown>) =>
    api.post('/admin/announcements', data),
  createEmergencyAlert: (data: Record<string, unknown>) =>
    api.post('/admin/emergency-alert', data),
  getSustainability: () => api.get('/admin/sustainability'),
};

export const hodAPI = {
  getDashboard: () => api.get('/hod/dashboard'),
  getStudentAnalytics: () => api.get('/hod/students/analytics'),
  getFacultyWorkload: () => api.get('/hod/faculty/workload'),
  getSkillGap: () => api.get('/hod/skill-gap'),
};

export const principalAPI = {
  getDashboard: () => api.get('/principal/dashboard'),
  getCampusAnalytics: () => api.get('/principal/analytics/campus'),
  runWhatIf: (data: Record<string, unknown>) => api.post('/principal/what-if', data),
  acknowledgeInsight: (id: string) =>
    api.patch(`/principal/insights/${id}/acknowledge`),
};

export const notificationAPI = {
  list: (params?: Record<string, unknown>) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  getAnnouncements: () => api.get('/notifications/announcements'),
  getEmergencyAlerts: () => api.get('/notifications/emergency-alerts'),
};

export const aiAPI = {
  getRiskAlerts: () => api.get('/ai/risk-alerts'),
  generateStudyPlan: (data: Record<string, unknown>) =>
    api.post('/ai/study-plan/generate', data),
  getSkillGap: (studentId: string) => api.get(`/ai/skill-gap/${studentId}`),
  askAssistant: (message: string, language?: string) =>
    api.post('/ai/assistant', { message, language }),
  getInsights: () => api.get('/ai/insights'),
  summarizeMeeting: (data: Record<string, unknown>) =>
    api.post('/ai/meeting/summarize', data),
};

export const campusAPI = {
  getLocations: (params?: Record<string, unknown>) =>
    api.get('/campus/locations', { params }),
  getDepartments: () => api.get('/campus/departments'),
};

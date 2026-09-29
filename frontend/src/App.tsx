import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoadingScreen from './components/ui/LoadingScreen';

// Auth
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));

// Student
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentAttendance = lazy(() => import('./pages/student/StudentAttendance'));
const StudentMarks = lazy(() => import('./pages/student/StudentMarks'));
const StudentAssignments = lazy(() => import('./pages/student/StudentAssignments'));
const StudentTimetable = lazy(() => import('./pages/student/StudentTimetable'));
const StudentSkills = lazy(() => import('./pages/student/StudentSkills'));
const StudyPlanner = lazy(() => import('./pages/student/StudyPlanner'));
const DigitalTwin = lazy(() => import('./pages/student/DigitalTwin'));

// Faculty
const FacultyDashboard = lazy(() => import('./pages/faculty/FacultyDashboard'));
const FacultyAttendance = lazy(() => import('./pages/faculty/FacultyAttendance'));
const FacultyMentees = lazy(() => import('./pages/faculty/FacultyMentees'));
const FacultyAtRisk = lazy(() => import('./pages/faculty/FacultyAtRisk'));
const FacultyAssignments = lazy(() => import('./pages/faculty/FacultyAssignments'));

// HOD
const HODDashboard = lazy(() => import('./pages/hod/HODDashboard'));
const HODAnalytics = lazy(() => import('./pages/hod/HODAnalytics'));
const HODFacultyWorkload = lazy(() => import('./pages/hod/HODFacultyWorkload'));
const HODSkillGap = lazy(() => import('./pages/hod/HODSkillGap'));

// Admin
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminEquipment = lazy(() => import('./pages/admin/AdminEquipment'));
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements'));
const AdminSustainability = lazy(() => import('./pages/admin/AdminSustainability'));

// Principal
const PrincipalDashboard = lazy(() => import('./pages/principal/PrincipalDashboard'));
const PrincipalAnalytics = lazy(() => import('./pages/principal/PrincipalAnalytics'));
const WhatIfSimulator = lazy(() => import('./pages/principal/WhatIfSimulator'));

// Shared
const ComplaintsPage = lazy(() => import('./pages/shared/ComplaintsPage'));
const EventsPage = lazy(() => import('./pages/shared/EventsPage'));
const CampusMapPage = lazy(() => import('./pages/shared/CampusMapPage'));
const NotificationsPage = lazy(() => import('./pages/shared/NotificationsPage'));
const CampusAssistant = lazy(() => import('./pages/shared/CampusAssistant'));
const SkillGapPage = lazy(() => import('./pages/shared/SkillGapPage'));

const RoleRedirect: React.FC = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return <Navigate to="/login" replace />;
  // Will be refined by ProtectedRoute
  return <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RoleRedirect />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                {/* ── Student ── */}
                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/attendance" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentAttendance />
                  </ProtectedRoute>
                } />
                <Route path="/marks" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentMarks />
                  </ProtectedRoute>
                } />
                <Route path="/assignments" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentAssignments />
                  </ProtectedRoute>
                } />
                <Route path="/timetable" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentTimetable />
                  </ProtectedRoute>
                } />
                <Route path="/skills" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentSkills />
                  </ProtectedRoute>
                } />
                <Route path="/study-planner" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudyPlanner />
                  </ProtectedRoute>
                } />
                <Route path="/digital-twin" element={
                  <ProtectedRoute allowedRoles={['student', 'faculty', 'mentor', 'hod', 'admin', 'principal']}>
                    <DigitalTwin />
                  </ProtectedRoute>
                } />

                {/* ── Faculty ── */}
                <Route path="/faculty/dashboard" element={
                  <ProtectedRoute allowedRoles={['faculty', 'hod']}>
                    <FacultyDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/faculty/attendance" element={
                  <ProtectedRoute allowedRoles={['faculty', 'hod']}>
                    <FacultyAttendance />
                  </ProtectedRoute>
                } />
                <Route path="/faculty/mentees" element={
                  <ProtectedRoute allowedRoles={['faculty', 'mentor', 'hod']}>
                    <FacultyMentees />
                  </ProtectedRoute>
                } />
                <Route path="/faculty/at-risk" element={
                  <ProtectedRoute allowedRoles={['faculty', 'mentor', 'hod']}>
                    <FacultyAtRisk />
                  </ProtectedRoute>
                } />
                <Route path="/faculty/assignments" element={
                  <ProtectedRoute allowedRoles={['faculty', 'hod']}>
                    <FacultyAssignments />
                  </ProtectedRoute>
                } />

                {/* ── HOD ── */}
                <Route path="/hod/dashboard" element={
                  <ProtectedRoute allowedRoles={['hod', 'principal', 'admin']}>
                    <HODDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/hod/analytics" element={
                  <ProtectedRoute allowedRoles={['hod', 'principal', 'admin']}>
                    <HODAnalytics />
                  </ProtectedRoute>
                } />
                <Route path="/hod/workload" element={
                  <ProtectedRoute allowedRoles={['hod', 'principal', 'admin']}>
                    <HODFacultyWorkload />
                  </ProtectedRoute>
                } />
                <Route path="/hod/skill-gap" element={
                  <ProtectedRoute allowedRoles={['hod', 'principal', 'admin']}>
                    <HODSkillGap />
                  </ProtectedRoute>
                } />

                {/* ── Admin ── */}
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute allowedRoles={['admin', 'principal']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute allowedRoles={['admin', 'principal']}>
                    <AdminUsers />
                  </ProtectedRoute>
                } />
                <Route path="/admin/equipment" element={
                  <ProtectedRoute allowedRoles={['admin', 'principal']}>
                    <AdminEquipment />
                  </ProtectedRoute>
                } />
                <Route path="/admin/announcements" element={
                  <ProtectedRoute allowedRoles={['admin', 'faculty', 'hod', 'principal']}>
                    <AdminAnnouncements />
                  </ProtectedRoute>
                } />
                <Route path="/admin/sustainability" element={
                  <ProtectedRoute allowedRoles={['admin', 'hod', 'principal']}>
                    <AdminSustainability />
                  </ProtectedRoute>
                } />

                {/* ── Principal ── */}
                <Route path="/principal/dashboard" element={
                  <ProtectedRoute allowedRoles={['principal', 'admin']}>
                    <PrincipalDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/principal/analytics" element={
                  <ProtectedRoute allowedRoles={['principal', 'admin']}>
                    <PrincipalAnalytics />
                  </ProtectedRoute>
                } />
                <Route path="/principal/what-if" element={
                  <ProtectedRoute allowedRoles={['principal', 'admin']}>
                    <WhatIfSimulator />
                  </ProtectedRoute>
                } />

                {/* ── Shared ── */}
                <Route path="/complaints" element={<ComplaintsPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/campus-map" element={<CampusMapPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/assistant" element={<CampusAssistant />} />
                <Route path="/skill-gap" element={<SkillGapPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}

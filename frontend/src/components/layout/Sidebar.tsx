import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, Calendar, ClipboardList, Bell,
  MessageSquare, AlertTriangle, BarChart3, Settings, LogOut, Map,
  Wrench, Zap, Target, TrendingUp, Shield, Leaf, Megaphone,
  Brain, ChevronLeft, ChevronRight, GraduationCap, Clock,
  FileText, Bot, Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { clsx } from 'clsx';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
  badge?: number;
}

const navItems: NavItem[] = [
  // Student
  { label: 'Dashboard',       path: '/dashboard',           icon: <LayoutDashboard size={18} />, roles: ['student'] },
  { label: 'Attendance',      path: '/attendance',          icon: <ClipboardList size={18} />,   roles: ['student'] },
  { label: 'Marks',           path: '/marks',               icon: <BookOpen size={18} />,        roles: ['student'] },
  { label: 'Assignments',     path: '/assignments',         icon: <FileText size={18} />,        roles: ['student'] },
  { label: 'Timetable',       path: '/timetable',           icon: <Clock size={18} />,           roles: ['student'] },
  { label: 'Study Planner',   path: '/study-planner',       icon: <Brain size={18} />,           roles: ['student'] },
  { label: 'My Skills',       path: '/skills',              icon: <Target size={18} />,          roles: ['student'] },
  { label: 'Digital Twin',    path: '/digital-twin',        icon: <Activity size={18} />,        roles: ['student'] },

  // Faculty
  { label: 'Dashboard',       path: '/faculty/dashboard',   icon: <LayoutDashboard size={18} />, roles: ['faculty'] },
  { label: 'Attendance',      path: '/faculty/attendance',  icon: <ClipboardList size={18} />,   roles: ['faculty'] },
  { label: 'Assignments',     path: '/faculty/assignments', icon: <FileText size={18} />,        roles: ['faculty'] },
  { label: 'Mentees',         path: '/faculty/mentees',     icon: <Users size={18} />,           roles: ['faculty', 'mentor'] },
  { label: 'At-Risk Students',path: '/faculty/at-risk',     icon: <AlertTriangle size={18} />,   roles: ['faculty', 'mentor'] },

  // HOD
  { label: 'Dashboard',       path: '/hod/dashboard',       icon: <LayoutDashboard size={18} />, roles: ['hod'] },
  { label: 'Student Analytics',path: '/hod/analytics',      icon: <BarChart3 size={18} />,       roles: ['hod'] },
  { label: 'Faculty Workload', path: '/hod/workload',        icon: <Activity size={18} />,        roles: ['hod'] },
  { label: 'Skill Gap',       path: '/hod/skill-gap',       icon: <Target size={18} />,          roles: ['hod'] },

  // Admin
  { label: 'Dashboard',       path: '/admin/dashboard',     icon: <LayoutDashboard size={18} />, roles: ['admin'] },
  { label: 'User Management', path: '/admin/users',         icon: <Users size={18} />,           roles: ['admin'] },
  { label: 'Equipment',       path: '/admin/equipment',     icon: <Wrench size={18} />,          roles: ['admin'] },
  { label: 'Announcements',   path: '/admin/announcements', icon: <Megaphone size={18} />,       roles: ['admin'] },
  { label: 'Sustainability',  path: '/admin/sustainability', icon: <Leaf size={18} />,            roles: ['admin'] },

  // Principal
  { label: 'Executive Dashboard', path: '/principal/dashboard', icon: <LayoutDashboard size={18} />, roles: ['principal'] },
  { label: 'Campus Analytics', path: '/principal/analytics', icon: <TrendingUp size={18} />,     roles: ['principal'] },
  { label: 'What-If Simulator',path: '/principal/what-if',  icon: <Zap size={18} />,             roles: ['principal'] },

  // Shared (all roles)
  { label: 'Complaints',      path: '/complaints',          icon: <MessageSquare size={18} />,   roles: ['student', 'faculty', 'mentor', 'hod', 'admin', 'principal'] },
  { label: 'Events',          path: '/events',              icon: <Calendar size={18} />,        roles: ['student', 'faculty', 'mentor', 'hod', 'admin', 'principal'] },
  { label: 'Campus Map',      path: '/campus-map',          icon: <Map size={18} />,             roles: ['student', 'faculty', 'mentor', 'hod', 'admin', 'principal'] },
  { label: 'AI Assistant',    path: '/assistant',           icon: <Bot size={18} />,             roles: ['student', 'faculty', 'mentor', 'hod', 'admin', 'principal'] },
  { label: 'Notifications',   path: '/notifications',       icon: <Bell size={18} />,            roles: ['student', 'faculty', 'mentor', 'hod', 'admin', 'principal'] },
];

interface Props {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<Props> = ({ isCollapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const filtered = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleLabel: Record<UserRole, string> = {
    student: 'Student',
    faculty: 'Faculty',
    mentor: 'Mentor',
    hod: 'Head of Department',
    admin: 'Administrator',
    principal: 'Principal',
  };

  return (
    <aside className={clsx(
      'relative flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className={clsx(
        'flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-gray-800',
        isCollapsed && 'justify-center px-2'
      )}>
        <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <GraduationCap size={18} className="text-white" />
        </div>
        {!isCollapsed && (
          <div>
            <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight">CampusPulse</div>
            <div className="text-xs text-primary-600 dark:text-primary-400 font-medium">AI Platform</div>
          </div>
        )}
      </div>

      {/* User info */}
      {!isCollapsed && user && (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {roleLabel[user.role]}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-0.5">
          {filtered.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx('sidebar-link', isActive && 'active', isCollapsed && 'justify-center px-2')
              }
              title={isCollapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {!isCollapsed && item.badge && item.badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className={clsx('p-2 border-t border-gray-100 dark:border-gray-800 space-y-0.5')}>
        <button
          onClick={handleLogout}
          className={clsx(
            'sidebar-link w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
            isCollapsed && 'justify-center px-2'
          )}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-10"
      >
        {isCollapsed
          ? <ChevronRight size={12} className="text-gray-500" />
          : <ChevronLeft size={12} className="text-gray-500" />
        }
      </button>
    </aside>
  );
};

export default Sidebar;

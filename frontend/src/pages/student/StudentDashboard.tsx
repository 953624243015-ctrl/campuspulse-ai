import React from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, BookOpen, FileText, Calendar, Bell, AlertTriangle, TrendingUp, Brain,
} from 'lucide-react';
import {
  RadialBarChart, RadialBar, ResponsiveContainer, Tooltip,
} from 'recharts';
import { studentAPI } from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery('student-dashboard', () => studentAPI.getDashboard());
  const dash = data?.data?.data;

  const attendancePct = dash?.attendance?.overallPct ?? 0;
  const attendanceColor = attendancePct >= 85 ? '#22c55e' : attendancePct >= 75 ? '#eab308' : '#ef4444';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Good morning, ${user?.firstName}! 👋`}
        subtitle={`${dash?.student?.departmentName || ''} · Semester ${dash?.student?.semester || ''}`}
      />

      {/* Risk Alert Banner */}
      {dash?.riskAlert && (
        <div className={`rounded-xl p-4 flex items-start gap-3 border ${
          dash.riskAlert.risk_level === 'high'
            ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
        }`}>
          <AlertTriangle size={18} className={dash.riskAlert.risk_level === 'high' ? 'text-red-600' : 'text-yellow-600'} />
          <div>
            <p className={`text-sm font-medium ${dash.riskAlert.risk_level === 'high' ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
              Academic Support Suggested
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{dash.riskAlert.recommendation}</p>
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Attendance"
          value={`${attendancePct}%`}
          icon={<ClipboardList size={20} />}
          iconColor={attendancePct >= 75 ? 'text-green-600' : 'text-red-600'}
          iconBg={attendancePct >= 75 ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}
          subtitle={`${dash?.attendance?.absencesThisMonth || 0} absences`}
          onClick={() => navigate('/attendance')}
        />
        <StatCard
          label="Avg. Marks"
          value={`${dash?.marksAvgPct ?? 0}%`}
          icon={<BookOpen size={20} />}
          iconColor="text-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          onClick={() => navigate('/marks')}
        />
        <StatCard
          label="Pending Assignments"
          value={dash?.pendingAssignments ?? 0}
          icon={<FileText size={20} />}
          iconColor="text-orange-600"
          iconBg="bg-orange-50 dark:bg-orange-900/30"
          onClick={() => navigate('/assignments')}
        />
        <StatCard
          label="Unread Alerts"
          value={dash?.unreadNotifications ?? 0}
          icon={<Bell size={20} />}
          iconColor="text-purple-600"
          iconBg="bg-purple-50 dark:bg-purple-900/30"
          onClick={() => navigate('/notifications')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Radial */}
        <div className="card p-5 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Attendance Overview</h3>
          <ResponsiveContainer width="100%" height={160}>
            <RadialBarChart
              innerRadius="60%" outerRadius="100%"
              data={[{ name: 'Attendance', value: attendancePct, fill: attendanceColor }]}
              startAngle={180} endAngle={0}
            >
              <RadialBar dataKey="value" cornerRadius={6} background={{ fill: '#f1f5f9' }} />
              <Tooltip formatter={(v) => `${v}%`} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="text-center -mt-6">
            <div className="text-3xl font-bold" style={{ color: attendanceColor }}>{attendancePct}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {attendancePct >= 75 ? '✅ Meets requirement' : '⚠️ Below 75% threshold'}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="card p-5 col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Upcoming Events</h3>
            <button onClick={() => navigate('/events')} className="text-xs text-primary-600 hover:underline">
              View all
            </button>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-12 rounded-lg" />
              ))}
            </div>
          ) : dash?.upcomingEvents?.length ? (
            <div className="space-y-3">
              {dash.upcomingEvents.map((ev: { id: string; title: string; event_type: string; start_datetime: string }) => (
                <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => navigate('/events')}>
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-primary-700 dark:text-primary-300 leading-none">
                      {format(new Date(ev.start_datetime), 'dd')}
                    </span>
                    <span className="text-[10px] text-primary-500 uppercase">
                      {format(new Date(ev.start_datetime), 'MMM')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{ev.title}</p>
                    <p className="text-xs text-gray-500 capitalize">{ev.event_type?.replace(/_/g, ' ')}</p>
                  </div>
                  <Badge variant="blue">Upcoming</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No upcoming events</p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Study Planner', icon: <Brain size={18} />, path: '/study-planner', color: 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300' },
          { label: 'My Timetable',  icon: <Calendar size={18} />, path: '/timetable',    color: 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300' },
          { label: 'AI Assistant',  icon: <TrendingUp size={18}/>, path: '/assistant',   color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' },
          { label: 'Report Issue',  icon: <AlertTriangle size={18}/>, path: '/complaints', color: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300' },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`card p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow cursor-pointer ${item.color}`}
          >
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StudentDashboard;

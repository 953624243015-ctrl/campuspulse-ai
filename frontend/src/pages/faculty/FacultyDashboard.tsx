import React from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, FileText, Clock, Activity } from 'lucide-react';
import { facultyAPI } from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import PageHeader from '../../components/ui/PageHeader';
import Badge, { statusVariant } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';

const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery('faculty-dashboard', () => facultyAPI.getDashboard());
  const dash = data?.data?.data;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Welcome, ${user?.firstName}!`}
        subtitle={`${dash?.faculty?.designation || ''} · ${dash?.faculty?.deptName || ''}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Subjects"
          value={dash?.assignedSubjects?.length ?? 0}
          icon={<FileText size={20} />}
          iconColor="text-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-900/30"
        />
        <StatCard
          label="Mentees"
          value={dash?.menteeCount ?? 0}
          icon={<Users size={20} />}
          iconColor="text-violet-600"
          iconBg="bg-violet-50 dark:bg-violet-900/30"
          onClick={() => navigate('/faculty/mentees')}
        />
        <StatCard
          label="Pending Grading"
          value={dash?.pendingGrading ?? 0}
          icon={<Clock size={20} />}
          iconColor="text-orange-600"
          iconBg="bg-orange-50 dark:bg-orange-900/30"
          onClick={() => navigate('/faculty/assignments')}
        />
        <StatCard
          label="Active Risk Alerts"
          value={dash?.activeRiskAlerts ?? 0}
          icon={<AlertTriangle size={20} />}
          iconColor="text-red-600"
          iconBg="bg-red-50 dark:bg-red-900/30"
          onClick={() => navigate('/faculty/at-risk')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Today's Classes</h3>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded" />)}</div>
          ) : dash?.todayClasses?.length ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {dash.todayClasses.map((cls: {
                period_number: number; subject_name: string; section_name: string;
                start_time: string; end_time: string; room_name?: string;
              }) => (
                <div key={cls.period_number} className="py-2.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary-700">P{cls.period_number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{cls.subject_name}</p>
                    <p className="text-xs text-gray-500">Section {cls.section_name} · {cls.room_name || '—'}</p>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">{cls.start_time?.slice(0,5)}–{cls.end_time?.slice(0,5)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No classes today</p>
          )}
        </div>

        {/* Assigned Subjects */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Assigned Subjects</h3>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {dash?.assignedSubjects?.map((s: { id: string; name: string; code: string; section_name: string }) => (
              <div key={s.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.name}</p>
                  <p className="text-xs text-gray-500">Section {s.section_name}</p>
                </div>
                <Badge variant="gray">{s.code}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;

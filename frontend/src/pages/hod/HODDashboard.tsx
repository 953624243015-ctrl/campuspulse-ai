import React from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, AlertTriangle, BookOpen, TrendingUp, Lightbulb } from 'lucide-react';
import { hodAPI } from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';

const HODDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery('hod-dashboard', () => hodAPI.getDashboard());
  const dash = data?.data?.data;

  const severityVariant = (s: string) => s === 'critical' ? 'red' : s === 'warning' ? 'yellow' : 'blue';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`${dash?.department?.name || 'Department'} Dashboard`}
        subtitle={`Head of Department · ${user?.firstName} ${user?.lastName}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Students', value: dash?.stats?.totalStudents ?? '—', icon: <GraduationCap size={18}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Faculty',  value: dash?.stats?.totalFaculty ?? '—',  icon: <Users size={18}/>,         color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Subjects', value: dash?.stats?.totalSubjects ?? '—', icon: <BookOpen size={18}/>,      color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Avg Attendance', value: `${dash?.stats?.avgAttendance ?? 0}%`, icon: <TrendingUp size={18}/>, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'At-Risk Students', value: dash?.stats?.atRiskStudents ?? '—', icon: <AlertTriangle size={18}/>, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Open Complaints', value: dash?.stats?.openComplaints ?? '—', icon: <AlertTriangle size={18}/>, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            iconColor={stat.color}
            iconBg={`${stat.bg} dark:bg-opacity-20`}
          />
        ))}
      </div>

      {/* AI Insights */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={16} className="text-amber-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Department Insights</h3>
        </div>
        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-lg"/>)}</div>
        ) : dash?.aiInsights?.length ? (
          <div className="space-y-2">
            {dash.aiInsights.map((insight: {
              id: string; title: string; description: string; severity: string; generated_at: string;
            }) => (
              <div key={insight.id} className={`p-3 rounded-lg border ${
                insight.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900'
                : insight.severity === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900'
                : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{insight.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{insight.description}</p>
                  </div>
                  <Badge variant={severityVariant(insight.severity)}>{insight.severity}</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">No AI insights available</p>
        )}
      </div>
    </div>
  );
};

export default HODDashboard;

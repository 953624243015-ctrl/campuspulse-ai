import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import {
  GraduationCap, Users, AlertTriangle, Calendar, TrendingUp,
  Lightbulb, CheckCircle, Activity,
} from 'lucide-react';
import { principalAPI } from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';

const PrincipalDashboard: React.FC = () => {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery('principal-dashboard', () => principalAPI.getDashboard());
  const dash = data?.data?.data;

  const ackMutation = useMutation(
    (id: string) => principalAPI.acknowledgeInsight(id),
    {
      onSuccess: () => {
        toast.success('Insight acknowledged');
        qc.invalidateQueries('principal-dashboard');
      },
    }
  );

  const severityStyle = (s: string) => s === 'critical'
    ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900'
    : s === 'warning'
    ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-900'
    : 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Executive Campus Intelligence"
        subtitle="Campus-wide performance at a glance"
        badge={
          <span className="text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 px-2 py-0.5 rounded-full">
            Principal View
          </span>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students"    value={dash?.kpis?.totalStudents ?? 0}     icon={<GraduationCap size={20}/>} iconColor="text-blue-600"   iconBg="bg-blue-50" />
        <StatCard label="Total Faculty"     value={dash?.kpis?.totalFaculty ?? 0}      icon={<Users size={20}/>}         iconColor="text-violet-600" iconBg="bg-violet-50" />
        <StatCard label="Overall Attendance" value={`${dash?.kpis?.overallAttendance ?? 0}%`} icon={<Activity size={20}/>} iconColor="text-teal-600" iconBg="bg-teal-50" />
        <StatCard label="At-Risk Students"  value={dash?.kpis?.atRiskStudents ?? 0}    icon={<AlertTriangle size={20}/>} iconColor="text-red-600"    iconBg="bg-red-50" />
        <StatCard label="Open Complaints"   value={dash?.kpis?.openComplaints ?? 0}    icon={<AlertTriangle size={20}/>} iconColor="text-orange-600" iconBg="bg-orange-50" />
        <StatCard label="Upcoming Events"   value={dash?.kpis?.upcomingEvents ?? 0}    icon={<Calendar size={20}/>}      iconColor="text-green-600"  iconBg="bg-green-50" />
        <StatCard label="Total Users"       value={dash?.kpis?.totalUsers ?? 0}        icon={<Users size={20}/>}         iconColor="text-gray-600"   iconBg="bg-gray-50" />
        <StatCard label="Campus Score"      value="87/100"                              icon={<TrendingUp size={20}/>}    iconColor="text-primary-600" iconBg="bg-primary-50"
          subtitle="Composite KPI" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Attendance */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Department Attendance</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dash?.departmentAttendance || []} margin={{ left: -20 }}>
              <XAxis dataKey="code" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="attendance_pct" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Event Participation Trend */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Event Participation Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={dash?.eventParticipation || []} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tickFormatter={(v) => v?.slice(0, 7)} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="registrations" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insights */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={16} className="text-amber-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Campus Insights</h3>
          <span className="ml-auto text-xs text-gray-400">Auto-generated · Based on real data</span>
        </div>
        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="skeleton h-16 rounded-lg"/>)}</div>
        ) : dash?.aiInsights?.length ? (
          <div className="space-y-2">
            {dash.aiInsights.map((insight: {
              id: string; title: string; description: string;
              severity: string; generated_at: string; is_acknowledged: boolean;
            }) => (
              <div key={insight.id}
                className={`p-3 rounded-lg border flex items-start gap-3 ${severityStyle(insight.severity)}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{insight.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{insight.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={
                    insight.severity === 'critical' ? 'red' :
                    insight.severity === 'warning' ? 'yellow' : 'blue'
                  }>{insight.severity}</Badge>
                  {!insight.is_acknowledged && (
                    <button
                      className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                      onClick={() => ackMutation.mutate(insight.id)}
                    >
                      <CheckCircle size={12} /> Dismiss
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No pending insights</p>
          </div>
        )}
      </div>

      {/* Complaint Breakdown */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Complaint Status Breakdown</h3>
        <div className="flex flex-wrap gap-3">
          {(dash?.complaintBreakdown || []).map((c: { status: string; count: number }) => (
            <div key={c.status} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Badge variant={
                c.status === 'resolved' || c.status === 'verified' ? 'green' :
                c.status === 'in_progress' || c.status === 'assigned' ? 'yellow' : 'blue'
              }>{c.status.replace(/_/g, ' ')}</Badge>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{c.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrincipalDashboard;

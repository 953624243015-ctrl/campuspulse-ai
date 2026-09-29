import React from 'react';
import { useQuery } from 'react-query';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { principalAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import { format } from 'date-fns';

const RISK_COLORS: Record<string, string> = { high: '#ef4444', moderate: '#eab308', low: '#22c55e' };

const PrincipalAnalytics: React.FC = () => {
  const { data, isLoading } = useQuery('campus-analytics', () => principalAPI.getCampusAnalytics());
  const analytics = data?.data?.data;

  const attendanceTrend = (analytics?.attendanceTrend || []).map((t: { week: string; attendance_pct: number }) => ({
    week: t.week ? format(new Date(t.week), 'dd MMM') : '',
    pct: parseFloat(t.attendance_pct as unknown as string || '0'),
  }));

  const assignmentTrend = (analytics?.assignmentTrend || []).map((t: { month: string; completion_rate: number }) => ({
    month: t.month ? format(new Date(t.month), 'MMM yy') : '',
    rate: parseFloat(t.completion_rate as unknown as string || '0'),
  }));

  const riskPie = (analytics?.riskDistribution || []).map((r: { risk_level: string; count: number }) => ({
    name: r.risk_level,
    value: parseInt(r.count as unknown as string || '0'),
    color: RISK_COLORS[r.risk_level] || '#94a3b8',
  }));

  const deptPerf = analytics?.departmentPerformance || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Campus Analytics" subtitle="12-week trends and department comparisons" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Attendance Trend (12 Weeks)</h3>
          {isLoading ? <div className="skeleton h-48 rounded" /> : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Line type="monotone" dataKey="pct" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Assignment Completion */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Assignment Completion Rate</h3>
          {isLoading ? <div className="skeleton h-48 rounded" /> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={assignmentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="rate" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Risk Distribution */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Student Risk Distribution</h3>
          {isLoading ? <div className="skeleton h-48 rounded" /> : riskPie.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={riskPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {riskPie.map((entry: { color: string }, i: number) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No risk data</div>
          )}
        </div>

        {/* Department Performance */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Department Avg. Marks</h3>
          {isLoading ? <div className="skeleton h-48 rounded" /> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={deptPerf} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="code" tick={{ fontSize: 11 }} width={50} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="avg_marks_pct" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrincipalAnalytics;

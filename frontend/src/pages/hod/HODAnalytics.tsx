import React from 'react';
import { useQuery } from 'react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { hodAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';

const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444'];

const HODAnalytics: React.FC = () => {
  const { data, isLoading } = useQuery('hod-analytics', () => hodAPI.getStudentAnalytics());
  const analytics = data?.data?.data;

  const attDist = analytics?.attendanceDistribution;
  const pieData = attDist ? [
    { name: 'Excellent (≥90%)', value: parseInt(attDist.excellent || '0') },
    { name: 'Good (75–90%)',    value: parseInt(attDist.good || '0') },
    { name: 'Borderline',      value: parseInt(attDist.borderline || '0') },
    { name: 'Critical (<60%)', value: parseInt(attDist.critical || '0') },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Department Analytics" subtitle="Student performance and attendance analysis" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Distribution */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Attendance Distribution</h3>
          {isLoading ? <div className="skeleton h-48 rounded"/> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Marks per Subject */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Average Marks by Subject</h3>
          {isLoading ? <div className="skeleton h-48 rounded"/> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics?.marksPerSubject || []} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="avg_pct" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Risk Summary */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Risk Level Summary</h3>
        <div className="flex gap-4 flex-wrap">
          {(analytics?.riskSummary || []).map((r: { risk_level: string; count: number }) => (
            <div key={r.risk_level} className={`flex-1 min-w-[100px] p-4 rounded-xl text-center border ${
              r.risk_level === 'high' ? 'bg-red-50 border-red-200' :
              r.risk_level === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
              'bg-green-50 border-green-200'
            }`}>
              <div className={`text-2xl font-bold ${
                r.risk_level === 'high' ? 'text-red-600' :
                r.risk_level === 'moderate' ? 'text-yellow-600' : 'text-green-600'
              }`}>{r.count}</div>
              <div className="text-xs text-gray-600 mt-0.5 capitalize">{r.risk_level} Risk</div>
            </div>
          ))}
          {!analytics?.riskSummary?.length && (
            <p className="text-sm text-gray-400">No risk data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HODAnalytics;

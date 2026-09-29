import React from 'react';
import { useQuery } from 'react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { studentAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import { clsx } from 'clsx';

const StudentAttendance: React.FC = () => {
  const { data, isLoading } = useQuery('my-attendance', () => studentAPI.getAttendance());
  const result = data?.data?.data;
  const subjects = result?.subjects || [];
  const overall = result?.overall;

  const overallPct = parseFloat(overall?.overall_pct || '0');
  const statusColor = overallPct >= 85 ? 'text-green-600' : overallPct >= 75 ? 'text-yellow-500' : 'text-red-600';

  const chartData = subjects.map((s: { subject_code: string; attendance_pct: number }) => ({
    name: s.subject_code,
    pct: parseFloat(s.attendance_pct as unknown as string) || 0,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Attendance"
        subtitle={`Semester ${result?.semester || ''}`}
      />

      {/* Overall */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Overall Attendance</p>
            <p className={clsx('text-5xl font-bold mt-1', statusColor)}>
              {overallPct}%
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {overall?.total_present || 0} present / {overall?.total_classes || 0} classes
            </p>
          </div>
          <div className="sm:ml-8 flex flex-wrap gap-3">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="text-xl font-bold text-green-600">{overall?.total_present || 0}</div>
              <div className="text-xs text-gray-500 mt-0.5">Present</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <div className="text-xl font-bold text-red-600">{overall?.total_absent || 0}</div>
              <div className="text-xs text-gray-500 mt-0.5">Absent</div>
            </div>
          </div>
          {overallPct < 75 && (
            <div className="sm:ml-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <p className="text-xs text-red-700 dark:text-red-300 font-medium">⚠️ Below 75% requirement</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Attend {Math.ceil(((0.75 * parseInt(overall?.total_classes || '0')) - parseInt(overall?.total_present || '0')) / 0.25)} more classes to reach 75%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Attendance by Subject</h3>
        {isLoading ? (
          <div className="skeleton h-48 rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                {chartData.map((entry: { pct: number }, index: number) => (
                  <Cell
                    key={index}
                    fill={entry.pct >= 85 ? '#22c55e' : entry.pct >= 75 ? '#eab308' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Subject Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Code</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Total</th>
              <th>Attendance %</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}><div className="skeleton h-4 rounded" /></td>
                  ))}
                </tr>
              ))
            ) : subjects.map((s: {
              subject_id: string; subject_name: string; subject_code: string;
              present: number; absent: number; total: number; attendance_pct: number;
            }) => {
              const pct = parseFloat(s.attendance_pct as unknown as string) || 0;
              return (
                <tr key={s.subject_id}>
                  <td className="font-medium">{s.subject_name}</td>
                  <td><Badge variant="gray">{s.subject_code}</Badge></td>
                  <td className="text-green-600 font-medium">{s.present}</td>
                  <td className="text-red-600 font-medium">{s.absent}</td>
                  <td>{s.total}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 max-w-[80px]">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: pct >= 85 ? '#22c55e' : pct >= 75 ? '#eab308' : '#ef4444',
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{pct}%</span>
                    </div>
                  </td>
                  <td>
                    <Badge variant={pct >= 85 ? 'green' : pct >= 75 ? 'yellow' : 'red'}>
                      {pct >= 85 ? 'Excellent' : pct >= 75 ? 'OK' : 'Low'}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentAttendance;

import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { studentAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';

const StudentMarks: React.FC = () => {
  const { data, isLoading } = useQuery('my-marks', () => studentAPI.getMarks());
  const result = data?.data?.data;
  const bySubject = result?.bySubject || {};

  const subjectCodes = Object.keys(bySubject);

  const chartData = subjectCodes.map((code) => {
    const entries = bySubject[code] as Array<{ marks_obtained: number; max_marks: number }>;
    const total = entries.reduce((s, e) => s + (e.marks_obtained / e.max_marks) * 100, 0);
    return { name: code, avg: Math.round(total / entries.length) };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="My Marks" subtitle={`Semester ${result?.semester || ''}`} />

      {/* Chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Performance by Subject</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Bar dataKey="avg" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table per subject */}
      {subjectCodes.map((code) => (
        <div key={code} className="table-container">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{code}</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Assessment</th>
                <th>Marks Obtained</th>
                <th>Max Marks</th>
                <th>Percentage</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {(bySubject[code] as Array<{
                assessment_name: string; assessment_code: string;
                marks_obtained: number; max_marks: number; grade: string;
              }>).map((row, i) => {
                const pct = row.max_marks > 0 ? Math.round((row.marks_obtained / row.max_marks) * 100) : 0;
                return (
                  <tr key={i}>
                    <td>{row.assessment_name}</td>
                    <td className="font-medium">{row.marks_obtained ?? '—'}</td>
                    <td>{row.max_marks}</td>
                    <td>
                      <Badge variant={pct >= 75 ? 'green' : pct >= 50 ? 'yellow' : 'red'}>
                        {pct}%
                      </Badge>
                    </td>
                    <td>{row.grade || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      {!isLoading && subjectCodes.length === 0 && (
        <div className="card p-12 text-center text-gray-400">
          No marks data available for this semester
        </div>
      )}
    </div>
  );
};

export default StudentMarks;

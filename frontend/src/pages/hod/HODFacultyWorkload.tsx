import React from 'react';
import { useQuery } from 'react-query';
import { hodAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';

const HODFacultyWorkload: React.FC = () => {
  const { data, isLoading } = useQuery('hod-faculty-workload', () => hodAPI.getFacultyWorkload());
  const faculty = data?.data?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Faculty Workload" subtitle="Weekly teaching hours and mentoring responsibilities" />
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Faculty</th>
              <th>Designation</th>
              <th>Subjects</th>
              <th>Weekly Hours</th>
              <th>Mentees</th>
              <th>Load</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({length:4}).map((_,i)=>(<tr key={i}>{Array.from({length:6}).map((_,j)=>(<td key={j}><div className="skeleton h-4 rounded"/></td>))}</tr>)) :
            faculty.length === 0 ? (<tr><td colSpan={6}><EmptyState title="No faculty data"/></td></tr>) :
            faculty.map((f: {
              id: string; first_name: string; last_name: string; designation: string;
              subject_count: number; weekly_hours: number; mentee_count: number;
            }) => {
              const hours = parseInt(f.weekly_hours as unknown as string || '0');
              const loadLevel = hours >= 20 ? 'High' : hours >= 12 ? 'Normal' : 'Low';
              const loadColor = hours >= 20 ? 'text-red-600' : hours >= 12 ? 'text-green-600' : 'text-yellow-600';
              return (
                <tr key={f.id}>
                  <td className="font-medium">{f.first_name} {f.last_name}</td>
                  <td className="text-gray-500">{f.designation || '—'}</td>
                  <td>{f.subject_count}</td>
                  <td>{hours}h</td>
                  <td>{f.mentee_count}</td>
                  <td><span className={`text-xs font-semibold ${loadColor}`}>{loadLevel}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HODFacultyWorkload;

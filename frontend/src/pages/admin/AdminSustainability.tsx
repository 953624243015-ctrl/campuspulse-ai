import React from 'react';
import { useQuery } from 'react-query';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend,
} from 'recharts';
import { adminAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import { Leaf, Zap, Droplets, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const AdminSustainability: React.FC = () => {
  const { data, isLoading } = useQuery('sustainability', () => adminAPI.getSustainability());
  const result = data?.data?.data;
  const monthly = result?.monthly || [];
  const byDept = result?.byDept || [];

  const latest = monthly[monthly.length - 1] || {};

  const chartData = monthly.map((m: { month: string; electricity: number; water: number; waste: number; recycled: number }) => ({
    month: format(new Date(m.month), 'MMM yy'),
    electricity: Math.round(parseFloat(m.electricity as unknown as string || '0')),
    water: Math.round(parseFloat(m.water as unknown as string || '0') / 1000),
    waste: Math.round(parseFloat(m.waste as unknown as string || '0')),
    recycled: Math.round(parseFloat(m.recycled as unknown as string || '0')),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Sustainability Dashboard" subtitle="Campus energy, water and waste tracking" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Electricity (kWh)" value={Math.round(parseFloat(latest.electricity || '0'))}
          icon={<Zap size={20} />} iconColor="text-yellow-600" iconBg="bg-yellow-50" />
        <StatCard label="Water (kL)" value={Math.round(parseFloat(latest.water || '0') / 1000)}
          icon={<Droplets size={20} />} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard label="Waste (kg)" value={Math.round(parseFloat(latest.waste || '0'))}
          icon={<Trash2 size={20} />} iconColor="text-red-600" iconBg="bg-red-50" />
        <StatCard label="Recycled (kg)" value={Math.round(parseFloat(latest.recycled || '0'))}
          icon={<Leaf size={20} />} iconColor="text-green-600" iconBg="bg-green-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Monthly Electricity (kWh)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="electricity" stroke="#eab308" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Waste vs Recycled (kg)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="waste" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="recycled" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Department Comparison</h3>
        <div className="table-container overflow-visible border-none shadow-none">
          <table className="data-table">
            <thead>
              <tr><th>Department</th><th>Electricity (kWh)</th><th>Water (kL)</th><th>Waste (kg)</th></tr>
            </thead>
            <tbody>
              {byDept.map((d: { dept_name: string; code: string; electricity: number; water: number; waste: number }) => (
                <tr key={d.code}>
                  <td className="font-medium">{d.dept_name}</td>
                  <td>{Math.round(parseFloat(d.electricity as unknown as string || '0'))}</td>
                  <td>{Math.round(parseFloat(d.water as unknown as string || '0') / 1000)}</td>
                  <td>{Math.round(parseFloat(d.waste as unknown as string || '0'))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSustainability;

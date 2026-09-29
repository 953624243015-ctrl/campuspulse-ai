import React from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, Calendar, Wrench, Megaphone, Shield } from 'lucide-react';
import { adminAPI } from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import PageHeader from '../../components/ui/PageHeader';
import Badge, { statusVariant } from '../../components/ui/Badge';
import { format } from 'date-fns';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery('admin-dashboard', () => adminAPI.getDashboard());
  const dash = data?.data?.data;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Admin Dashboard" subtitle="Campus operations overview" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users"       value={dash?.stats?.totalUsers ?? 0}     icon={<Users size={20}/>}       iconColor="text-blue-600"   iconBg="bg-blue-50"   onClick={() => navigate('/admin/users')} />
        <StatCard label="Open Complaints"   value={dash?.stats?.openComplaints ?? 0} icon={<AlertTriangle size={20}/>} iconColor="text-red-600"  iconBg="bg-red-50"    onClick={() => navigate('/complaints')} />
        <StatCard label="Maintenance Needed" value={dash?.stats?.maintenanceNeeded ?? 0} icon={<Wrench size={20}/>} iconColor="text-orange-600" iconBg="bg-orange-50" onClick={() => navigate('/admin/equipment')} />
        <StatCard label="Active Risk Alerts" value={dash?.stats?.activeRiskAlerts ?? 0} icon={<Shield size={20}/>}  iconColor="text-violet-600" iconBg="bg-violet-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Complaints */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Complaints</h3>
            <button onClick={() => navigate('/complaints')} className="text-xs text-primary-600 hover:underline">View all</button>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {(dash?.recentComplaints || []).map((c: {
              id: string; ticket_number: string; title: string; status: string;
              priority: string; category_name: string; created_at: string;
            }) => (
              <div key={c.id} className="py-2.5 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{c.ticket_number} · {c.category_name}</p>
                </div>
                <div className="flex flex-col gap-1 items-end flex-shrink-0">
                  <Badge variant={statusVariant(c.status)}>{c.status.replace('_', ' ')}</Badge>
                  <Badge variant={statusVariant(c.priority)}>{c.priority}</Badge>
                </div>
              </div>
            ))}
            {!isLoading && !dash?.recentComplaints?.length && (
              <p className="text-sm text-gray-400 py-4 text-center">No recent complaints</p>
            )}
          </div>
        </div>

        {/* Maintenance Needed */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Maintenance Needed</h3>
            <button onClick={() => navigate('/admin/equipment')} className="text-xs text-primary-600 hover:underline">View all</button>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {(dash?.maintenanceNeeded || []).map((e: {
              id: string; name: string; asset_tag: string; status: string;
              category_name: string; location_name: string;
            }) => (
              <div key={e.id} className="py-2.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{e.name}</p>
                  <p className="text-xs text-gray-500">{e.category_name} · {e.location_name}</p>
                </div>
                <Badge variant={statusVariant(e.status)}>{e.status.replace(/_/g,' ')}</Badge>
              </div>
            ))}
            {!isLoading && !dash?.maintenanceNeeded?.length && (
              <p className="text-sm text-gray-400 py-4 text-center">No maintenance issues</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

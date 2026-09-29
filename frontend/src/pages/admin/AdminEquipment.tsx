import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Search, Wrench } from 'lucide-react';
import { adminAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Badge, { statusVariant } from '../../components/ui/Badge';
import { format } from 'date-fns';

const AdminEquipment: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery(
    ['admin-equipment', statusFilter],
    () => adminAPI.getEquipment({ status: statusFilter || undefined })
  );
  const equipment = data?.data?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Equipment & Maintenance" subtitle="Track campus equipment status and maintenance schedules" />

      <div className="flex gap-3 flex-wrap">
        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {['operational','needs_maintenance','under_maintenance','decommissioned'].map(s => (
            <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Equipment</th><th>Category</th><th>Location</th><th>Brand/Model</th>
              <th>Status</th><th>Last Maintenance</th><th>Next Due</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({length:5}).map((_,i)=>(
              <tr key={i}>{Array.from({length:7}).map((_,j)=>(<td key={j}><div className="skeleton h-4 rounded"/></td>))}</tr>
            )) : equipment.map((e: {
              id: string; name: string; asset_tag: string; category_name: string;
              location_name: string; brand: string; model: string; status: string;
              last_maintenance_date?: string; next_maintenance_date?: string;
            }) => {
              const nextDue = e.next_maintenance_date ? new Date(e.next_maintenance_date) : null;
              const isOverdue = nextDue && nextDue < new Date();
              return (
                <tr key={e.id}>
                  <td>
                    <div className="font-medium text-sm">{e.name}</div>
                    <div className="text-xs text-gray-400">{e.asset_tag}</div>
                  </td>
                  <td className="text-gray-500 text-xs">{e.category_name}</td>
                  <td className="text-gray-500 text-xs">{e.location_name}</td>
                  <td className="text-xs">{e.brand} {e.model}</td>
                  <td><Badge variant={statusVariant(e.status)}>{e.status.replace(/_/g,' ')}</Badge></td>
                  <td className="text-xs text-gray-400">
                    {e.last_maintenance_date ? format(new Date(e.last_maintenance_date),'dd MMM yyyy') : '—'}
                  </td>
                  <td className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                    {nextDue ? format(nextDue,'dd MMM yyyy') : '—'}
                    {isOverdue && ' (Overdue)'}
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

export default AdminEquipment;

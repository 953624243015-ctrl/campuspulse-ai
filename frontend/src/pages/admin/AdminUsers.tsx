import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Search, Loader2 } from 'lucide-react';
import { adminAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Badge, { statusVariant } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const AdminUsers: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', role: 'student', firstName: '', lastName: '',
    phone: '', departmentId: '',
  });

  const { data, isLoading } = useQuery(
    ['admin-users', search, roleFilter],
    () => adminAPI.getUsers({ search: search || undefined, role: roleFilter || undefined }),
    { keepPreviousData: true }
  );
  const users = data?.data?.data || [];

  const createMutation = useMutation(
    (data: Record<string, unknown>) => adminAPI.createUser(data),
    {
      onSuccess: () => {
        toast.success('User created');
        qc.invalidateQueries('admin-users');
        setShowCreate(false);
        setForm({ email: '', password: '', role: 'student', firstName: '', lastName: '', phone: '', departmentId: '' });
      },
    }
  );

  const toggleMutation = useMutation(
    ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminAPI.updateUser(id, { isActive }),
    { onSuccess: () => { toast.success('User updated'); qc.invalidateQueries('admin-users'); } }
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="User Management"
        subtitle={`${data?.data?.meta?.total || 0} total users`}
        actions={
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16}/> Add User
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            className="input pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          {['student','faculty','mentor','hod','admin','principal'].map(r => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Role</th><th>Department</th>
              <th>Status</th><th>Last Login</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({length:5}).map((_,i)=>(
              <tr key={i}>{Array.from({length:7}).map((_,j)=>(<td key={j}><div className="skeleton h-4 rounded"/></td>))}</tr>
            )) : users.length === 0 ? (
              <tr><td colSpan={7}><EmptyState title="No users found"/></td></tr>
            ) : users.map((u: {
              id: string; first_name: string; last_name: string; email: string;
              role: string; dept_name: string; is_active: boolean; last_login?: string;
            }) => (
              <tr key={u.id}>
                <td className="font-medium">{u.first_name} {u.last_name}</td>
                <td className="text-gray-500 text-xs">{u.email}</td>
                <td><Badge variant="blue">{u.role}</Badge></td>
                <td className="text-gray-500 text-xs">{u.dept_name || '—'}</td>
                <td>
                  <Badge variant={u.is_active ? 'green' : 'red'}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="text-xs text-gray-400">
                  {u.last_login ? format(new Date(u.last_login), 'dd MMM') : '—'}
                </td>
                <td>
                  <button
                    className="text-xs text-primary-600 hover:underline"
                    onClick={() => toggleMutation.mutate({ id: u.id, isActive: !u.is_active })}
                  >
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add New User"
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button
              className="btn-primary"
              onClick={() => createMutation.mutate(form as Record<string, unknown>)}
              disabled={createMutation.isLoading || !form.email || !form.password || !form.firstName}
            >
              {createMutation.isLoading && <Loader2 size={14} className="animate-spin"/>} Create User
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
              <input type="text" className="input" value={form.firstName}
                onChange={e => setForm(f=>({...f, firstName:e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
              <input type="text" className="input" value={form.lastName}
                onChange={e => setForm(f=>({...f, lastName:e.target.value}))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input type="email" className="input" value={form.email}
              onChange={e => setForm(f=>({...f, email:e.target.value}))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
            <input type="password" className="input" placeholder="Min 8 characters" value={form.password}
              onChange={e => setForm(f=>({...f, password:e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
              <select className="input" value={form.role} onChange={e => setForm(f=>({...f, role:e.target.value}))}>
                {['student','faculty','mentor','hod','admin','principal'].map(r=>(
                  <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input type="tel" className="input" value={form.phone}
                onChange={e => setForm(f=>({...f, phone:e.target.value}))} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsers;

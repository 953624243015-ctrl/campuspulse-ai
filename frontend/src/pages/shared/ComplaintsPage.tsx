import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Search, Filter, Loader2, Mic } from 'lucide-react';
import { complaintAPI, campusAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Badge, { statusVariant } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ComplaintsPage: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', categoryId: '', locationId: '', isAnonymous: false,
  });

  const { data, isLoading } = useQuery(
    ['complaints', statusFilter, search],
    () => complaintAPI.list({ status: statusFilter || undefined, search: search || undefined }),
    { keepPreviousData: true }
  );
  const complaints = data?.data?.data || [];

  const { data: locData } = useQuery('campus-locations', () => campusAPI.getLocations());
  const locations = locData?.data?.data || [];

  const categories = [
    { id: 'cc000000-0000-0000-0000-000000000001', name: 'Wi-Fi / Internet' },
    { id: 'cc000000-0000-0000-0000-000000000002', name: 'Classroom Infrastructure' },
    { id: 'cc000000-0000-0000-0000-000000000003', name: 'Laboratory Equipment' },
    { id: 'cc000000-0000-0000-0000-000000000004', name: 'Electrical / Power' },
    { id: 'cc000000-0000-0000-0000-000000000005', name: 'Water Supply' },
    { id: 'cc000000-0000-0000-0000-000000000006', name: 'Cleanliness / Hygiene' },
    { id: 'cc000000-0000-0000-0000-000000000007', name: 'Transport' },
    { id: 'cc000000-0000-0000-0000-000000000008', name: 'Security' },
    { id: 'cc000000-0000-0000-0000-000000000011', name: 'Other' },
  ];

  const submitMutation = useMutation(
    (data: Record<string, unknown>) => complaintAPI.submit(data),
    {
      onSuccess: (res) => {
        const d = res.data.data;
        toast.success(d.isDuplicate
          ? `Similar issue already reported. Linked to existing ticket.`
          : `Complaint submitted – Ticket: ${d.ticket_number}`
        );
        qc.invalidateQueries('complaints');
        setShowCreate(false);
        setForm({ title: '', description: '', categoryId: '', locationId: '', isAnonymous: false });
      },
    }
  );

  const priorityColor = (p: string) => p === 'critical' ? 'border-l-red-600' : p === 'high' ? 'border-l-orange-500' : '';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Complaints"
        subtitle="Report and track campus issues"
        actions={
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Submit Complaint
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search complaints..." className="input pl-8"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {['submitted', 'assigned', 'in_progress', 'resolved', 'verified', 'closed'].map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card p-4"><div className="skeleton h-20 rounded" /></div>
        )) : complaints.length === 0 ? (
          <EmptyState title="No complaints found"
            description={user?.role === 'student' ? "You haven't submitted any complaints yet." : "No complaints match your filters."} />
        ) : complaints.map((c: {
          id: string; ticket_number: string; title: string; description: string;
          status: string; priority: string; category_name: string; location_name?: string;
          location_block?: string; submitted_by_name: string; created_at: string;
          related_count: number; is_anonymous: boolean;
        }) => (
          <div key={c.id} className={`card p-4 border-l-4 ${priorityColor(c.priority)} hover:shadow-card-hover transition-shadow`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-gray-400">{c.ticket_number}</span>
                  <Badge variant={statusVariant(c.status)}>{c.status.replace(/_/g, ' ')}</Badge>
                  <Badge variant={statusVariant(c.priority)}>{c.priority}</Badge>
                  {c.related_count > 0 && (
                    <Badge variant="purple">{c.related_count + 1} similar reports</Badge>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{c.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{c.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>{c.category_name}</span>
                  {c.location_name && <span>· {c.location_name}</span>}
                  <span>· {format(new Date(c.created_at), 'dd MMM yyyy')}</span>
                  {!c.is_anonymous && <span>· {c.submitted_by_name}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Submit a Complaint"
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button
              className="btn-primary"
              onClick={() => submitMutation.mutate(form as Record<string, unknown>)}
              disabled={submitMutation.isLoading || !form.title || !form.description || !form.categoryId}
            >
              {submitMutation.isLoading && <Loader2 size={14} className="animate-spin" />} Submit
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
            <select className="input" value={form.categoryId}
              onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Location (optional)</label>
            <select className="input" value={form.locationId}
              onChange={e => setForm(f => ({ ...f, locationId: e.target.value }))}>
              <option value="">Select location</option>
              {locations.map((l: { id: string; name: string; block?: string }) => (
                <option key={l.id} value={l.id}>{l.name}{l.block ? ` (Block ${l.block})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
            <input type="text" className="input" placeholder="Brief issue title"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
            <textarea rows={4} className="input resize-none"
              placeholder="Describe the issue in detail. Include location, time, and impact..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" className="rounded" checked={form.isAnonymous}
              onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))} />
            Submit anonymously
          </label>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 If many students report the same issue in the same location, it will be automatically flagged as a recurring campus issue and escalated with higher priority.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ComplaintsPage;

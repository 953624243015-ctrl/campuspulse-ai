import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Loader2, Megaphone, AlertTriangle } from 'lucide-react';
import { adminAPI, notificationAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const AdminAnnouncements: React.FC = () => {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', isCollegeWide: true, isUrgent: false });
  const [emergencyForm, setEmergencyForm] = useState({ title: '', message: '', alertType: 'general', severity: 'critical' });

  const { data, isLoading } = useQuery('announcements', () => adminAPI.getAnnouncements());
  const announcements = data?.data?.data || [];

  const createMutation = useMutation(
    (data: Record<string, unknown>) => adminAPI.createAnnouncement(data),
    {
      onSuccess: () => {
        toast.success('Announcement published');
        qc.invalidateQueries('announcements');
        setShowCreate(false);
        setForm({ title: '', content: '', isCollegeWide: true, isUrgent: false });
      },
    }
  );

  const emergencyMutation = useMutation(
    (data: Record<string, unknown>) => adminAPI.createEmergencyAlert(data),
    {
      onSuccess: () => {
        toast.success('Emergency alert sent to all users');
        setShowEmergency(false);
        setEmergencyForm({ title: '', message: '', alertType: 'general', severity: 'critical' });
      },
    }
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Announcements"
        actions={
          <div className="flex gap-2">
            <button className="btn-danger" onClick={() => setShowEmergency(true)}>
              <AlertTriangle size={16} /> Emergency Alert
            </button>
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> New Announcement
            </button>
          </div>
        }
      />

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4"><div className="skeleton h-16 rounded" /></div>
          ))
        ) : announcements.map((a: {
          id: string; title: string; content: string; is_urgent: boolean;
          is_college_wide: boolean; published_at: string; created_by_name: string; created_by_role: string;
        }) => (
          <div key={a.id} className={`card p-4 ${a.is_urgent ? 'border-l-4 border-red-500' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`mt-0.5 flex-shrink-0 ${a.is_urgent ? 'text-red-600' : 'text-primary-600'}`}>
                  <Megaphone size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{a.title}</h3>
                    {a.is_urgent && <Badge variant="red">Urgent</Badge>}
                    {a.is_college_wide && <Badge variant="blue">College-wide</Badge>}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-1.5">
                    By {a.created_by_name} ({a.created_by_role}) ·{' '}
                    {format(new Date(a.published_at), 'dd MMM yyyy, HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!isLoading && announcements.length === 0 && (
          <div className="card p-12 text-center text-gray-400">No announcements yet</div>
        )}
      </div>

      {/* Create Announcement Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Announcement"
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button
              className="btn-primary"
              onClick={() => createMutation.mutate(form as Record<string, unknown>)}
              disabled={createMutation.isLoading || !form.title || !form.content}
            >
              {createMutation.isLoading && <Loader2 size={14} className="animate-spin" />} Publish
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
            <input type="text" className="input" placeholder="Announcement title"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
            <textarea rows={5} className="input resize-none" placeholder="Full announcement text..."
              value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" className="rounded" checked={form.isCollegeWide}
                onChange={e => setForm(f => ({ ...f, isCollegeWide: e.target.checked }))} />
              College-wide
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" className="rounded" checked={form.isUrgent}
                onChange={e => setForm(f => ({ ...f, isUrgent: e.target.checked }))} />
              Mark as Urgent
            </label>
          </div>
        </div>
      </Modal>

      {/* Emergency Alert Modal */}
      <Modal
        isOpen={showEmergency}
        onClose={() => setShowEmergency(false)}
        title="Send Emergency Alert"
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowEmergency(false)}>Cancel</button>
            <button
              className="btn-danger"
              onClick={() => emergencyMutation.mutate(emergencyForm as Record<string, unknown>)}
              disabled={emergencyMutation.isLoading || !emergencyForm.title || !emergencyForm.message}
            >
              {emergencyMutation.isLoading && <Loader2 size={14} className="animate-spin" />}
              <AlertTriangle size={14} /> Send Emergency Alert
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-700 dark:text-red-300 font-medium">
              ⚠️ This will send an urgent notification to all users. Use only for genuine emergencies.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Alert Title</label>
            <input type="text" className="input" placeholder="e.g. Building Evacuation – Block A"
              value={emergencyForm.title} onChange={e => setEmergencyForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Message</label>
            <textarea rows={4} className="input resize-none"
              placeholder="Detailed emergency instructions..."
              value={emergencyForm.message} onChange={e => setEmergencyForm(f => ({ ...f, message: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Alert Type</label>
              <select className="input" value={emergencyForm.alertType}
                onChange={e => setEmergencyForm(f => ({ ...f, alertType: e.target.value }))}>
                {['general', 'evacuation', 'weather', 'electrical', 'medical', 'security'].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Severity</label>
              <select className="input" value={emergencyForm.severity}
                onChange={e => setEmergencyForm(f => ({ ...f, severity: e.target.value }))}>
                {['info', 'warning', 'critical', 'emergency'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminAnnouncements;

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { User, MessageSquare, Loader2 } from 'lucide-react';
import { facultyAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

const FacultyMentees: React.FC = () => {
  const qc = useQueryClient();
  const [sessionModal, setSessionModal] = useState<{ studentId: string; name: string } | null>(null);
  const [form, setForm] = useState({ sessionDate: '', durationMinutes: 30, discussionPoints: '', actionItems: '' });

  const { data, isLoading } = useQuery('my-mentees', () => facultyAPI.getMentees());
  const mentees = data?.data?.data || [];

  const sessionMutation = useMutation(
    (payload: Record<string, unknown>) => facultyAPI.createMentoringSession(payload),
    {
      onSuccess: () => {
        toast.success('Session recorded');
        setSessionModal(null);
        setForm({ sessionDate: '', durationMinutes: 30, discussionPoints: '', actionItems: '' });
      },
    }
  );

  const handleSessionSubmit = () => {
    if (!form.sessionDate) { toast.error('Session date required'); return; }
    sessionMutation.mutate({
      studentId: sessionModal!.studentId,
      sessionDate: form.sessionDate,
      durationMinutes: form.durationMinutes,
      discussionPoints: form.discussionPoints,
      actionItems: form.actionItems.split('\n').filter(Boolean),
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="My Mentees" subtitle={`${mentees.length} students assigned`} />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="card p-4"><div className="skeleton h-28 rounded"/></div>)}
        </div>
      ) : mentees.length === 0 ? (
        <EmptyState title="No mentees assigned" description="Mentor assignments will appear here." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mentees.map((m: {
            id: string; student_id: string; first_name: string; last_name: string;
            roll_number: string; section_name: string; current_semester: number;
            attendance_pct: number; risk_level?: string;
          }) => (
            <div key={m.student_id} className="card p-4 hover:shadow-card-hover transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
                    {m.first_name[0]}{m.last_name[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {m.first_name} {m.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{m.roll_number} · Sec {m.section_name}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Attendance: <strong>{parseFloat(m.attendance_pct as unknown as string || '0').toFixed(1)}%</strong>
                    </span>
                    {m.risk_level && m.risk_level !== 'low' && (
                      <Badge variant={m.risk_level === 'high' ? 'red' : 'yellow'}>
                        {m.risk_level} risk
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <button
                className="btn-secondary w-full mt-3 text-xs"
                onClick={() => setSessionModal({ studentId: m.student_id, name: `${m.first_name} ${m.last_name}` })}
              >
                <MessageSquare size={12} /> Record Session
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!sessionModal}
        onClose={() => setSessionModal(null)}
        title={`Record Mentoring Session – ${sessionModal?.name}`}
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setSessionModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleSessionSubmit} disabled={sessionMutation.isLoading}>
              {sessionMutation.isLoading && <Loader2 size={14} className="animate-spin" />} Save Session
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Session Date</label>
            <input type="date" className="input"
              value={form.sessionDate} onChange={e => setForm(f => ({...f, sessionDate: e.target.value}))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Duration (minutes)</label>
            <input type="number" className="input" min={10} max={120}
              value={form.durationMinutes} onChange={e => setForm(f => ({...f, durationMinutes: +e.target.value}))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Discussion Points</label>
            <textarea rows={3} className="input resize-none"
              placeholder="Key topics discussed..."
              value={form.discussionPoints} onChange={e => setForm(f => ({...f, discussionPoints: e.target.value}))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Action Items (one per line)</label>
            <textarea rows={3} className="input resize-none"
              placeholder="Action items agreed upon..."
              value={form.actionItems} onChange={e => setForm(f => ({...f, actionItems: e.target.value}))} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FacultyMentees;

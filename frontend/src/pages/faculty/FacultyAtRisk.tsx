import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { facultyAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Badge, { statusVariant } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const FacultyAtRisk: React.FC = () => {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<{ alertId: string; name: string; recommendation: string } | null>(null);
  const [notes, setNotes] = useState('');

  const { data, isLoading } = useQuery('at-risk-students', () => facultyAPI.getAtRiskStudents());
  const alerts = data?.data?.data || [];

  const ackMutation = useMutation(
    ({ alertId, notes }: { alertId: string; notes: string }) =>
      facultyAPI.acknowledgeAlert(alertId, notes),
    {
      onSuccess: () => {
        toast.success('Alert acknowledged');
        qc.invalidateQueries('at-risk-students');
        setSelected(null);
        setNotes('');
      },
    }
  );

  const riskColor = (level: string) =>
    level === 'high' ? 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900'
    : level === 'moderate' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-900'
    : 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="At-Risk Students"
        subtitle="Students who may need additional academic support based on AI analysis"
      />

      <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          ℹ️ This early warning system identifies students who may need support — not a ranking or penalty system. Please approach students with care and empathy.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="card p-4"><div className="skeleton h-24 rounded"/></div>)}</div>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={<CheckCircle size={40} className="text-green-400" />}
          title="No active risk alerts"
          description="All students in your sections are showing satisfactory engagement levels."
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((a: {
            alert_id: string; risk_level: string; risk_factors: Record<string, unknown>;
            recommendation: string; first_name: string; last_name: string;
            roll_number: string; section_name: string; generated_at: string;
            acknowledged_at?: string;
          }) => (
            <div key={a.alert_id} className={`card p-4 border ${riskColor(a.risk_level)}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`flex-shrink-0 mt-0.5 ${a.risk_level === 'high' ? 'text-red-600' : 'text-yellow-600'}`}>
                    <AlertTriangle size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {a.first_name} {a.last_name}
                      </p>
                      <Badge variant="gray">{a.roll_number}</Badge>
                      <Badge variant={a.risk_level === 'high' ? 'red' : 'yellow'}>
                        {a.risk_level?.toUpperCase()} RISK
                      </Badge>
                      {a.acknowledged_at && <Badge variant="green">Acknowledged</Badge>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Section {a.section_name}</p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {a.risk_factors?.attendance_pct !== undefined && (
                        <span className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                          Attendance: {a.risk_factors.attendance_pct as number}%
                        </span>
                      )}
                      {a.risk_factors?.avg_marks !== undefined && (
                        <span className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                          Avg Marks: {a.risk_factors.avg_marks as number}%
                        </span>
                      )}
                      {a.risk_factors?.assignments_missed !== undefined && (
                        <span className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                          Assignments missed: {a.risk_factors.assignments_missed as number}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{a.recommendation}</p>
                  </div>
                </div>
                {!a.acknowledged_at && (
                  <button
                    className="btn-secondary text-xs flex-shrink-0"
                    onClick={() => setSelected({ alertId: a.alert_id, name: `${a.first_name} ${a.last_name}`, recommendation: a.recommendation })}
                  >
                    Acknowledge
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Detected {format(new Date(a.generated_at), 'dd MMM yyyy, HH:mm')}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => { setSelected(null); setNotes(''); }}
        title="Acknowledge Risk Alert"
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
            <button
              className="btn-primary"
              onClick={() => selected && ackMutation.mutate({ alertId: selected.alertId, notes })}
              disabled={ackMutation.isLoading}
            >
              {ackMutation.isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
              Acknowledge & Save
            </button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Acknowledging alert for <strong>{selected.name}</strong>. You can add follow-up notes below.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs text-gray-600 dark:text-gray-400">
              {selected.recommendation}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Follow-up Notes (optional)
              </label>
              <textarea
                rows={3}
                className="input resize-none"
                placeholder="Actions taken, counselling notes, next steps..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FacultyAtRisk;

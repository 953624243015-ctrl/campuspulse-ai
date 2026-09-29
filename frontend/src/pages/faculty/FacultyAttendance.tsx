import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { CheckCircle, XCircle, Loader2, ClipboardList } from 'lucide-react';
import { facultyAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';

const FacultyAttendance: React.FC = () => {
  const [sessionForm, setSessionForm] = useState({
    subjectId: '', sectionId: '', sessionDate: new Date().toISOString().split('T')[0], periodNumber: 1,
  });
  const [session, setSession] = useState<{ id: string } | null>(null);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});

  const { data: studentsData } = useQuery('faculty-students', () => facultyAPI.getStudents());
  const students = studentsData?.data?.data || [];

  const { data: subjectsData } = useQuery('faculty-workload', () => facultyAPI.getWorkload());
  const subjects = subjectsData?.data?.data?.subjects || [];

  const sessionMutation = useMutation(
    (data: Record<string, unknown>) => facultyAPI.createAttendanceSession(data),
    {
      onSuccess: (res) => {
        setSession(res.data.data);
        // Pre-populate all absent
        const initial: Record<string, 'absent'> = {};
        students.filter((s: { section_name: string }) =>
          s.section_name === subjects.find((sub: { code: string }) => sub.code === sessionForm.subjectId)?.section_name
        ).forEach((s: { student_id: string }) => { initial[s.student_id] = 'absent'; });
        setAttendance(initial);
        toast.success('Session opened');
      },
    }
  );

  const markMutation = useMutation(
    (data: Record<string, unknown>) => facultyAPI.markAttendance(data),
    { onSuccess: () => toast.success('Attendance saved!') }
  );

  const handleOpenSession = () => {
    sessionMutation.mutate({
      subjectId: sessionForm.subjectId,
      sectionId: sessionForm.sectionId,
      sessionDate: sessionForm.sessionDate,
      periodNumber: sessionForm.periodNumber,
    });
  };

  const handleSave = () => {
    if (!session) return;
    const records = Object.entries(attendance).map(([studentId, status]) => ({ studentId, status }));
    markMutation.mutate({ sessionId: session.id, records });
  };

  const markAll = (status: 'present' | 'absent') => {
    setAttendance((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => { updated[k] = status; });
      return updated;
    });
  };

  const presentCount = Object.values(attendance).filter(v => v === 'present').length;
  const totalCount = Object.keys(attendance).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Mark Attendance" subtitle="Open a session and mark student attendance" />

      {!session ? (
        <div className="card p-6 max-w-lg">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Open Attendance Session</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
              <select className="input"
                value={sessionForm.subjectId}
                onChange={e => setSessionForm(f => ({...f, subjectId: e.target.value}))}>
                <option value="">Select subject</option>
                {subjects.map((s: { subject_code: string; subject_name: string }) => (
                  <option key={s.subject_code} value={s.subject_code}>{s.subject_name} ({s.subject_code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Section ID</label>
              <input type="text" className="input" placeholder="Section ID"
                value={sessionForm.sectionId}
                onChange={e => setSessionForm(f => ({...f, sectionId: e.target.value}))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                <input type="date" className="input" value={sessionForm.sessionDate}
                  onChange={e => setSessionForm(f => ({...f, sessionDate: e.target.value}))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Period</label>
                <input type="number" min={1} max={8} className="input" value={sessionForm.periodNumber}
                  onChange={e => setSessionForm(f => ({...f, periodNumber: +e.target.value}))} />
              </div>
            </div>
            <button
              className="btn-primary w-full justify-center"
              onClick={handleOpenSession}
              disabled={sessionMutation.isLoading || !sessionForm.subjectId}
            >
              {sessionMutation.isLoading ? <Loader2 size={16} className="animate-spin" /> : <ClipboardList size={16} />}
              Open Session
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="card p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Session open · <strong className="text-green-600">{presentCount}</strong>/{totalCount} present
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs" onClick={() => markAll('present')}>
                <CheckCircle size={12} /> Mark All Present
              </button>
              <button className="btn-secondary text-xs" onClick={() => markAll('absent')}>
                <XCircle size={12} /> Mark All Absent
              </button>
              <button className="btn-primary text-xs" onClick={handleSave} disabled={markMutation.isLoading}>
                {markMutation.isLoading ? <Loader2 size={14} className="animate-spin" /> : null} Save
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Student</th><th>Roll No.</th><th>Status</th></tr>
              </thead>
              <tbody>
                {Object.keys(attendance).map((studentId) => {
                  const student = students.find((s: { student_id: string }) => s.student_id === studentId);
                  const status = attendance[studentId];
                  return (
                    <tr key={studentId}>
                      <td className="font-medium">{student?.first_name} {student?.last_name}</td>
                      <td><Badge variant="gray">{student?.roll_number}</Badge></td>
                      <td>
                        <div className="flex gap-1">
                          {(['present', 'absent', 'late'] as const).map(s => (
                            <button
                              key={s}
                              onClick={() => setAttendance(prev => ({...prev, [studentId]: s}))}
                              className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                                status === s
                                  ? s === 'present' ? 'bg-green-500 text-white border-green-500'
                                  : s === 'absent' ? 'bg-red-500 text-white border-red-500'
                                  : 'bg-yellow-500 text-white border-yellow-500'
                                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default FacultyAttendance;

import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { Plus, Loader2 } from 'lucide-react';
import { facultyAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const FacultyAssignments: React.FC = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', subjectId: '', sectionId: '', dueDate: '', maxMarks: 10,
  });
  const qc = useQueryClient();

  const createMutation = useMutation(
    (data: Record<string, unknown>) => facultyAPI.createAssignment(data),
    {
      onSuccess: () => {
        toast.success('Assignment created');
        setShowCreate(false);
        setForm({ title: '', description: '', subjectId: '', sectionId: '', dueDate: '', maxMarks: 10 });
        qc.invalidateQueries('faculty-assignments');
      },
    }
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Assignments"
        actions={
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create Assignment
          </button>
        }
      />

      <div className="card p-8 text-center text-gray-400">
        <p className="text-sm">Assignment management coming soon. Use the Create button to publish new assignments.</p>
      </div>

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Assignment"
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button
              className="btn-primary"
              onClick={() => createMutation.mutate(form as Record<string, unknown>)}
              disabled={createMutation.isLoading || !form.title || !form.subjectId}
            >
              {createMutation.isLoading && <Loader2 size={14} className="animate-spin" />} Publish
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {[
            { label: 'Title', key: 'title', type: 'text', placeholder: 'Assignment title' },
            { label: 'Subject ID', key: 'subjectId', type: 'text', placeholder: 'Subject UUID' },
            { label: 'Section ID', key: 'sectionId', type: 'text', placeholder: 'Section UUID' },
            { label: 'Due Date', key: 'dueDate', type: 'datetime-local', placeholder: '' },
            { label: 'Max Marks', key: 'maxMarks', type: 'number', placeholder: '10' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                type={type}
                className="input"
                placeholder={placeholder}
                value={(form as Record<string, unknown>)[key] as string}
                onChange={e => setForm(f => ({...f, [key]: type === 'number' ? +e.target.value : e.target.value}))}
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea rows={3} className="input resize-none" placeholder="Assignment details..."
              value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FacultyAssignments;

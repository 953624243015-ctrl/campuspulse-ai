import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { studentAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Badge, { statusVariant } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

type Tab = 'pending' | 'submitted' | 'overdue' | 'all';

const StudentAssignments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const { data, isLoading } = useQuery('my-assignments', () => studentAPI.getAssignments());
  const result = data?.data?.data;

  const assignments = {
    all: result?.assignments || [],
    pending: result?.pending || [],
    submitted: result?.submitted || [],
    overdue: result?.overdue || [],
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'pending',   label: `Pending (${assignments.pending.length})`,   icon: <Clock size={14} />,        color: 'text-yellow-600' },
    { key: 'submitted', label: `Submitted (${assignments.submitted.length})`,icon: <CheckCircle size={14} />,  color: 'text-green-600' },
    { key: 'overdue',   label: `Overdue (${assignments.overdue.length})`,    icon: <AlertCircle size={14} />,  color: 'text-red-600' },
    { key: 'all',       label: `All (${assignments.all.length})`,            icon: <FileText size={14} />,     color: 'text-gray-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Assignments" />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className={tab.color}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Assignment Cards */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4"><div className="skeleton h-16 rounded" /></div>
          ))
        ) : assignments[activeTab].length === 0 ? (
          <EmptyState
            title={`No ${activeTab} assignments`}
            description="Check back later or switch to a different tab."
          />
        ) : assignments[activeTab].map((a: {
          id: string; title: string; subject_name: string; subject_code: string;
          faculty_name: string; due_date: string; max_marks: number;
          submission_status?: string; marks_obtained?: number; feedback?: string;
          submitted_at?: string;
        }) => {
          const isOverdue = !a.submitted_at && new Date(a.due_date) < new Date();
          const isPending = !a.submitted_at && !isOverdue;

          return (
            <div key={a.id} className="card p-4 hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{a.title}</h3>
                    {a.submission_status && (
                      <Badge variant={statusVariant(a.submission_status)}>{a.submission_status}</Badge>
                    )}
                    {isPending && <Badge variant="yellow">Pending</Badge>}
                    {isOverdue && <Badge variant="red">Overdue</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {a.subject_name} · {a.faculty_name}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">Due</p>
                  <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>
                    {format(new Date(a.due_date), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>

              {a.submitted_at && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4 text-xs text-gray-500">
                  <span>Submitted: {format(new Date(a.submitted_at), 'dd MMM yyyy')}</span>
                  {a.marks_obtained !== undefined && a.marks_obtained !== null && (
                    <span className="font-medium text-green-600">
                      Marks: {a.marks_obtained}/{a.max_marks}
                    </span>
                  )}
                  {a.feedback && (
                    <span className="text-gray-400 truncate max-w-xs">Feedback: {a.feedback}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentAssignments;

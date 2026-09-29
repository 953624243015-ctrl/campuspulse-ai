import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { useForm } from 'react-hook-form';
import { Brain, Loader2, CheckCircle, Calendar, Clock } from 'lucide-react';
import { aiAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface PlanForm {
  examDate: string;
  dailyStudyHours: number;
  weakTopics: string;
}

const StudyPlanner: React.FC = () => {
  const [plan, setPlan] = useState<{ title: string; tasks: Array<{
    title: string; scheduledDate: string; durationMinutes: number; isCompleted: boolean;
  }>; note?: string } | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());

  const { register, handleSubmit, formState: { errors } } = useForm<PlanForm>({
    defaultValues: { dailyStudyHours: 4 },
  });

  const mutation = useMutation(
    (data: Record<string, unknown>) => aiAPI.generateStudyPlan(data),
    {
      onSuccess: (res) => {
        setPlan(res.data.data);
        toast.success('Study plan generated!');
      },
      onError: () => toast.error('Failed to generate plan'),
    }
  );

  const onSubmit = (data: PlanForm) => {
    mutation.mutate({
      examDate: data.examDate,
      dailyStudyHours: data.dailyStudyHours,
      weakTopics: data.weakTopics.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  const toggleTask = (index: number) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  // Group tasks by date
  const tasksByDate: Record<string, typeof plan.tasks> = {};
  if (plan) {
    plan.tasks.forEach((t, i) => {
      const d = t.scheduledDate;
      if (!tasksByDate[d]) tasksByDate[d] = [];
      (tasksByDate[d] as typeof plan.tasks).push({ ...t, _index: i } as typeof plan.tasks[number] & { _index: number });
    });
  }

  const completedCount = completedTasks.size;
  const totalCount = plan?.tasks?.length || 0;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="AI Study Planner"
        subtitle="Generate a personalized study schedule based on your exam dates and subjects"
      />

      {/* Generator Form */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={18} className="text-violet-600" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Generate Study Plan</h3>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Exam Date</label>
            <input
              type="date"
              className="input"
              {...register('examDate', { required: 'Exam date is required' })}
            />
            {errors.examDate && <p className="text-xs text-red-500 mt-1">{errors.examDate.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Daily Study Hours</label>
            <input
              type="number"
              min={1} max={12}
              className="input"
              {...register('dailyStudyHours', { required: true, min: 1, max: 12 })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Weak Topics (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. Recursion, SQL Joins"
              className="input"
              {...register('weakTopics')}
            />
          </div>
          <div className="md:col-span-3">
            <button type="submit" className="btn-primary" disabled={mutation.isLoading}>
              {mutation.isLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Generating...</>
              ) : (
                <><Brain size={16} /> Generate AI Plan</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Plan Display */}
      {plan && (
        <>
          {/* Progress */}
          <div className="card p-5 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{plan.title}</h3>
                <span className="text-sm font-medium text-primary-600">{completedCount}/{totalCount} tasks</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-primary-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{progressPct}% complete</p>
            </div>
            {plan.note && (
              <div className="text-xs text-gray-400 max-w-xs">{plan.note}</div>
            )}
          </div>

          {/* Task List by Date */}
          <div className="space-y-4">
            {Object.entries(tasksByDate).map(([date, tasks]) => (
              <div key={date} className="card p-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                  <Calendar size={14} className="text-primary-600" />
                  <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {format(new Date(date), 'EEEE, dd MMM yyyy')}
                  </h4>
                </div>
                <div className="space-y-2">
                  {tasks.map((task: { title: string; durationMinutes: number; isCompleted: boolean; _index: number }) => (
                    <div
                      key={task._index}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        completedTasks.has(task._index)
                          ? 'bg-green-50 dark:bg-green-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => toggleTask(task._index)}
                    >
                      <CheckCircle
                        size={16}
                        className={completedTasks.has(task._index) ? 'text-green-500' : 'text-gray-300'}
                      />
                      <span className={`text-sm flex-1 ${
                        completedTasks.has(task._index) ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        {task.title}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={11} />{task.durationMinutes} min
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StudyPlanner;

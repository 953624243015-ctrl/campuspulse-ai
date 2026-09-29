import React from 'react';
import { useQuery } from 'react-query';
import { Clock } from 'lucide-react';
import { studentAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

const StudentTimetable: React.FC = () => {
  const { data, isLoading } = useQuery('my-timetable', () => studentAPI.getTimetable());
  const byDay = data?.data?.data?.byDay || {};

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="My Timetable" />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="card p-4"><div className="skeleton h-32 rounded" /></div>)}
        </div>
      ) : Object.keys(byDay).length === 0 ? (
        <EmptyState title="No timetable found" description="Your timetable has not been set up yet. Please contact your class advisor." />
      ) : (
        <div className="space-y-4">
          {DAYS.filter((d) => byDay[d]?.length > 0).map((day) => (
            <div key={day} className={`card overflow-hidden ${day === today ? 'ring-2 ring-primary-500' : ''}`}>
              <div className={`px-4 py-2.5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 ${
                day === today ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-gray-50 dark:bg-gray-800'
              }`}>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{day}</h3>
                {day === today && <Badge variant="blue">Today</Badge>}
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {byDay[day].map((slot: {
                  id: string; period_number: number; start_time: string; end_time: string;
                  subject_name: string; subject_code: string; is_lab: boolean;
                  faculty_name: string; room_name?: string;
                }) => (
                  <div key={slot.id} className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex-shrink-0 w-16 text-center">
                      <div className="text-xs font-bold text-gray-500 dark:text-gray-400">P{slot.period_number}</div>
                      <div className="text-xs text-gray-400">{slot.start_time?.slice(0, 5)}</div>
                    </div>
                    <div className={`w-1 self-stretch rounded-full ${slot.is_lab ? 'bg-violet-400' : 'bg-primary-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{slot.subject_name}</p>
                        {slot.is_lab && <Badge variant="purple">Lab</Badge>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{slot.faculty_name}</p>
                    </div>
                    <div className="text-right text-xs text-gray-400 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <Clock size={11} />
                        {slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}
                      </div>
                      {slot.room_name && <div className="mt-0.5">{slot.room_name}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentTimetable;

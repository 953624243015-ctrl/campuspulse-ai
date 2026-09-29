import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Calendar, MapPin, Users, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { eventAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Badge, { statusVariant } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const EventsPage: React.FC = () => {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('upcoming');

  const { data, isLoading } = useQuery(
    ['events', statusFilter],
    () => eventAPI.list({ status: statusFilter || undefined }),
    { keepPreviousData: true }
  );
  const events = data?.data?.data || [];

  const registerMutation = useMutation(
    (id: string) => eventAPI.register(id),
    {
      onSuccess: () => {
        toast.success('Registered successfully!');
        qc.invalidateQueries('events');
      },
    }
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Events" subtitle="Campus events, workshops and activities" />

      {/* Status Filter */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {['upcoming', 'ongoing', 'completed', ''].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Event Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4"><div className="skeleton h-48 rounded" /></div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={<Calendar size={40} className="text-gray-300" />}
          title="No events found"
          description="Check back later for upcoming events."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ev: {
            id: string; title: string; description?: string; event_type: string;
            start_datetime: string; end_datetime: string; status: string;
            venue_name?: string; dept_name?: string; organizer_name: string;
            registered_count: number; max_participants?: number; is_registered: boolean;
            registration_deadline?: string;
          }) => {
            const isFull = ev.max_participants && ev.registered_count >= ev.max_participants;
            const deadlinePassed = ev.registration_deadline && new Date(ev.registration_deadline) < new Date();

            return (
              <div key={ev.id} className="card overflow-hidden hover:shadow-card-hover transition-shadow flex flex-col">
                {/* Colored Header */}
                <div className={`p-4 ${
                  ev.event_type === 'workshop' ? 'bg-violet-50 dark:bg-violet-900/20' :
                  ev.event_type === 'symposium' ? 'bg-blue-50 dark:bg-blue-900/20' :
                  ev.event_type === 'cultural' ? 'bg-pink-50 dark:bg-pink-900/20' :
                  'bg-green-50 dark:bg-green-900/20'
                }`}>
                  <div className="flex items-start justify-between">
                    <Badge variant={statusVariant(ev.status)}>{ev.status}</Badge>
                    <Badge variant="gray">{ev.event_type?.replace(/_/g, ' ')}</Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mt-2 line-clamp-2">
                    {ev.title}
                  </h3>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={12} />
                    <span>{format(new Date(ev.start_datetime), 'dd MMM yyyy, hh:mm a')}</span>
                  </div>
                  {ev.venue_name && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin size={12} />
                      <span>{ev.venue_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users size={12} />
                    <span>
                      {ev.registered_count} registered
                      {ev.max_participants ? ` / ${ev.max_participants}` : ''}
                    </span>
                  </div>
                  {ev.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{ev.description}</p>
                  )}
                </div>

                {/* Action */}
                <div className="px-4 pb-4">
                  {ev.is_registered ? (
                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                      <CheckCircle size={16} /> Registered
                    </div>
                  ) : ev.status !== 'upcoming' ? (
                    <span className="text-xs text-gray-400">Registration closed</span>
                  ) : isFull ? (
                    <span className="text-xs text-red-500 font-medium">Event Full</span>
                  ) : deadlinePassed ? (
                    <span className="text-xs text-red-500">Registration deadline passed</span>
                  ) : (
                    <button
                      className="btn-primary w-full justify-center text-sm"
                      onClick={() => registerMutation.mutate(ev.id)}
                      disabled={registerMutation.isLoading}
                    >
                      {registerMutation.isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                      Register
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventsPage;

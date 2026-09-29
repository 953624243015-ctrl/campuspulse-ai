import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Bell, CheckCheck, Megaphone, AlertTriangle } from 'lucide-react';
import { notificationAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

const NotificationsPage: React.FC = () => {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery('notifications', () => notificationAPI.list());
  const { data: announcementsData } = useQuery('user-announcements', () => notificationAPI.getAnnouncements());
  const { data: alertsData } = useQuery('emergency-alerts', () => notificationAPI.getEmergencyAlerts());

  const notifications = data?.data?.data?.notifications || [];
  const announcements = announcementsData?.data?.data || [];
  const emergencyAlerts = alertsData?.data?.data || [];

  const markAllMutation = useMutation(
    () => notificationAPI.markAllRead(),
    {
      onSuccess: () => {
        toast.success('All notifications marked as read');
        qc.invalidateQueries('notifications');
      },
    }
  );

  const markOneMutation = useMutation(
    (id: string) => notificationAPI.markRead(id),
    { onSuccess: () => qc.invalidateQueries('notifications') }
  );

  const unreadCount = notifications.filter((n: { is_read: boolean }) => !n.is_read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        actions={
          unreadCount > 0 ? (
            <button className="btn-secondary text-xs" onClick={() => markAllMutation.mutate()}>
              <CheckCheck size={14} /> Mark all read
            </button>
          ) : undefined
        }
      />

      {/* Emergency Alerts */}
      {emergencyAlerts.length > 0 && (
        <div className="space-y-2">
          {emergencyAlerts.map((ea: { id: string; title: string; message: string; severity: string; created_at: string }) => (
            <div key={ea.id} className="card p-4 border-l-4 border-red-600 bg-red-50 dark:bg-red-900/20">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-200">{ea.title}</p>
                    <Badge variant="red">Emergency</Badge>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">{ea.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{format(new Date(ea.created_at), 'dd MMM yyyy, HH:mm')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone size={16} className="text-primary-600" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Announcements</h3>
          </div>
          <div className="space-y-3">
            {announcements.slice(0, 5).map((a: {
              id: string; title: string; content: string; is_urgent: boolean;
              published_at: string; created_by_name: string;
            }) => (
              <div key={a.id} className={`p-3 rounded-lg border ${
                a.is_urgent ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'
              }`}>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white flex-1">{a.title}</p>
                  {a.is_urgent && <Badge variant="red">Urgent</Badge>}
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {a.created_by_name} · {formatDistanceToNow(new Date(a.published_at), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Notifications */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">All Notifications</h3>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded" />)}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={32} className="text-gray-300" />}
            title="No notifications"
            description="You're all caught up!"
          />
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {notifications.map((n: {
              id: string; type: string; title: string; message?: string;
              is_read: boolean; created_at: string; action_url?: string;
            }) => (
              <div
                key={n.id}
                className={`px-5 py-3.5 flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  !n.is_read ? 'bg-blue-50/50 dark:bg-blue-900/5' : ''
                }`}
                onClick={() => !n.is_read && markOneMutation.mutate(n.id)}
              >
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary-600 flex-shrink-0 mt-1.5" />
                )}
                <div className={`flex-1 min-w-0 ${n.is_read ? 'ml-3.5' : ''}`}>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                  {n.message && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

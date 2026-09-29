import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Sun, Moon, Search, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { notificationAPI } from '../../services/api';
import { clsx } from 'clsx';

const Header: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [emergencyAlerts, setEmergencyAlerts] = useState<Array<{ id: string; title: string; severity: string }>>([]);

  useEffect(() => {
    // Poll notifications every 60s
    const fetchNotifications = async () => {
      try {
        const { data } = await notificationAPI.list({ isRead: false, limit: 1 });
        setUnread(data.data?.unreadCount || 0);
      } catch { /* silent */ }
    };

    const fetchAlerts = async () => {
      try {
        const { data } = await notificationAPI.getEmergencyAlerts();
        setEmergencyAlerts(data.data || []);
      } catch { /* silent */ }
    };

    fetchNotifications();
    fetchAlerts();

    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, []);

  const getBreadcrumb = () => {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    if (!segments.length) return 'Home';
    return segments.map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')).join(' › ');
  };

  return (
    <>
      {/* Emergency Alert Banner */}
      {emergencyAlerts.length > 0 && (
        <div className="bg-red-600 text-white px-4 py-2 flex items-center gap-2 text-sm animate-pulse">
          <AlertTriangle size={16} />
          <span className="font-medium">Emergency Alert:</span>
          <span>{emergencyAlerts[0].title}</span>
          <Link to="/notifications" className="ml-auto underline text-red-100 text-xs">View all</Link>
        </div>
      )}

      <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-4 sticky top-0 z-20">
        {/* Breadcrumb */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{getBreadcrumb()}</p>
        </div>

        {/* Search */}
        <button
          className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          onClick={() => navigate('/campus-map')}
        >
          <Search size={14} />
          <span className="hidden lg:inline">Search campus...</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>

        {/* User Avatar */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;

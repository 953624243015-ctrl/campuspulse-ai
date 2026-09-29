import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Navigate } from 'react-router-dom';

const roleHome: Record<UserRole, string> = {
  student: '/dashboard',
  faculty: '/faculty/dashboard',
  mentor: '/faculty/dashboard',
  hod: '/hod/dashboard',
  admin: '/admin/dashboard',
  principal: '/principal/dashboard',
};

const AppLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();

  // Redirect to role's home if at root
  if (user && window.location.pathname === '/') {
    return <Navigate to={roleHome[user.role]} replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

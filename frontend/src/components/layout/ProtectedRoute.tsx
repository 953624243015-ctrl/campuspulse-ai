import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import LoadingScreen from '../ui/LoadingScreen';

interface Props {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<Props> = ({ allowedRoles, children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to role's home
    const homeMap: Record<UserRole, string> = {
      student: '/dashboard',
      faculty: '/faculty/dashboard',
      mentor: '/faculty/dashboard',
      hod: '/hod/dashboard',
      admin: '/admin/dashboard',
      principal: '/principal/dashboard',
    };
    return <Navigate to={homeMap[user.role]} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;

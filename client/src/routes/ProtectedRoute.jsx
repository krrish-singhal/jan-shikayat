import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ROLES } from '../constants/roles.js';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, loading, defaultDashboard } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Verifying municipal authorization...</span>
        </div>
      </div>
    );
  }

  // If user is not authenticated
  if (!user) {
    const isCitizenOnly = allowedRoles.length === 1 && allowedRoles[0] === ROLES.CITIZEN;
    const loginRoute = isCitizenOnly ? '/login' : '/staff/login';
    return <Navigate to={loginRoute} state={{ from: location }} replace />;
  }

  // If user is authenticated but not authorized for this role/portal
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={defaultDashboard} replace />;
  }

  return <Outlet />;
};

export const GuestRoute = () => {
  const { user, loading, defaultDashboard } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={defaultDashboard} replace />;
  }

  return <Outlet />;
};

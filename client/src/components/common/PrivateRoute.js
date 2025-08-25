import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { t } = useTranslation();
  const { currentUser, loading, token, handleAuthError } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // If we're in a terminal route but don't have a valid token, handle the error
    if (!loading && !token && location.pathname.startsWith('/terminal')) {
      handleAuthError();
    }
  }, [loading, token, location, handleAuthError]);

  if (loading) {
    return <div className="container text-center py-5">{t('common.loading', 'Loading...')}</div>;
  }

  // Redirect unauthenticated users trying to access terminal pages
  if (!currentUser && location.pathname.startsWith('/terminal')) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin access for admin routes
  if (location.pathname.startsWith('/terminal/admin') && currentUser?.role !== 'admin') {
    return <Navigate to="/terminal" replace />;
  }

  // Make sure token is still valid for terminal routes
  if (!token && location.pathname.startsWith('/terminal')) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Allow access to non-terminal pages even when not authenticated
  if (!location.pathname.startsWith('/terminal')) {
    return children;
  }

  return currentUser ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRoute;

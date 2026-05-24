import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import i18n from '../../i18n/i18n';
import SubscriptionGate from '../terminal/SubscriptionGate';

const PrivateRoute = ({ children }) => {
  const { t } = useTranslation();
  const { currentUser, loading, token, handleAuthError } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Terminal is Macedonian-only; lock language on entry.
    if (location.pathname.startsWith('/terminal') && i18n.language !== 'mk') {
      i18n.changeLanguage('mk');
    }
    if (!loading && !token && location.pathname.startsWith('/terminal')) {
      handleAuthError();
    }
  }, [loading, token, location, handleAuthError]);

  if (loading) {
    return <div className="container text-center py-5">{t('common.loading', 'Loading...')}</div>;
  }

  if (!currentUser && location.pathname.startsWith('/terminal')) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin-only routes (platform admin, not admin_user)
  if (location.pathname.startsWith('/terminal/admin/') && currentUser?.role !== 'admin') {
    return <Navigate to="/terminal" replace />;
  }

  if (!token && location.pathname.startsWith('/terminal')) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!location.pathname.startsWith('/terminal')) {
    return children;
  }

  if (!currentUser) return <Navigate to="/login" state={{ from: location }} replace />;

  // Force a password change on first login for sub-seats with mustChangePassword=true.
  if (currentUser.mustChangePassword === true &&
      location.pathname !== '/terminal/change-password') {
    return <Navigate to="/terminal/change-password" replace />;
  }

  // Wrap terminal content with the SubscriptionGate (renders nothing if access OK).
  return (
    <>
      {children}
      <SubscriptionGate />
    </>
  );
};

export default PrivateRoute;

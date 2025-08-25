import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const AuthCallback = () => {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useAuth();
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        
        if (!token) {
          throw new Error(t('auth.noTokenProvided', 'No authentication token provided'));
        }
        
        await loginWithToken(token);
        navigate('/terminal');
      } catch (error) {
        setError(error.message);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };
    
    handleCallback();
  }, [location, loginWithToken, navigate, t]);
  
  return (
    <div className="container text-center py-5">
      {error ? (
        <div>
          <h2>{t('auth.authenticationFailed', 'Authentication Failed')}</h2>
          <p>{error}</p>
          <p>{t('auth.redirectingToLogin', 'Redirecting to login page...')}</p>
        </div>
      ) : (
        <div>
          <h2>{t('auth.authenticating', 'Authenticating...')}</h2>
          <p>{t('auth.pleaseWait', 'Please wait while we complete the authentication process.')}</p>
        </div>
      )}
    </div>
  );
};

export default AuthCallback;

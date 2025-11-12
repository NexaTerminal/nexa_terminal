import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import AuthMessage from './AuthMessage';
import { validatePassword, validatePasswordMatch, validateUsername } from '../../utils/passwordValidation';
import styles from '../../styles/common/LoginModal.module.css';

const LoginModal = ({ isOpen, onClose, redirectPath }) => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);

  const { loginWithUsername, registerSimple } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login validation
        if (!username) {
          throw new Error('Корисничкото име или даночен број е задолжително');
        }
        if (!password) {
          throw new Error('Лозинката е задолжителна');
        }

        const result = await loginWithUsername(username, password);

        if (result.success) {
          setSuccess('Успешна најава! Пренасочување...');
          setTimeout(() => {
            navigate(redirectPath || '/terminal');
          }, 1000);
        } else {
          const errorMessage = result.error || 'Неуспешна најава';
          if (errorMessage.includes('Invalid credentials') || errorMessage.includes('password') || errorMessage.includes('лозинка')) {
            setError('Неточна лозинка. Ве молиме проверете ја лозинката и обидете се повторно.');
          } else if (errorMessage.includes('User not found') || errorMessage.includes('username') || errorMessage.includes('корисник')) {
            setError('Корисничкото име или даночен број не постои. Проверете ги податоците или се регистрирајте.');
          } else {
            setError(errorMessage);
          }
        }
      } else {
        // Registration validation
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.isValid) {
          throw new Error(usernameValidation.errors[0]);
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          throw new Error('Лозинката не ги исполнува безбедносните барања');
        }

        const passwordMatch = validatePasswordMatch(password, confirmPassword);
        if (!passwordMatch.isValid) {
          throw new Error(passwordMatch.error);
        }

        const result = await registerSimple(username, password);
        if (result.success) {
          setSuccess('Успешна регистрација! Добредојдовте во Nexa Terminal!');
          setTimeout(() => {
            navigate(redirectPath || '/terminal');
          }, 1500);
        } else {
          const errorMessage = result.error || 'Неуспешна регистрација';
          if (errorMessage.includes('already exists') || errorMessage.includes('постои') || errorMessage.includes('taken')) {
            setError('Ова корисничко име е веќе зафатено. Ве молиме изберете друго.');
          } else {
            setError(errorMessage);
          }
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setShowPasswordStrength(false);
  };

  const handlePasswordFocus = () => {
    if (!isLogin) {
      setShowPasswordStrength(true);
    }
  };

  const handleGoogleLogin = () => {
    const apiURL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
    const redirect = redirectPath || '/terminal';
    const googleAuthUrl = `${apiURL}/auth/google?state=${encodeURIComponent(redirect)}`;
    window.location.href = googleAuthUrl;
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className={styles.modalHeader}>
          <img
            src="/nexa-logo-navbar.png"
            alt="Nexa"
            className={styles.nexaLogo}
          />
          <h2>{isLogin ? 'Најава' : 'Регистрација'}</h2>
          <p className={styles.subtitle}>
            {isLogin ? 'Најавете се за да продолжите' : 'Создајте нов профил'}
          </p>
        </div>

        <div className={styles.loginCard}>
          <AuthMessage
            type="error"
            message={error}
            onClose={() => setError('')}
          />

          <AuthMessage
            type="success"
            message={success}
            onClose={() => setSuccess('')}
          />

          <form className={styles.loginForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="username" className={styles.formLabel}>
                {isLogin ? 'Корисничко име или даночен број' : 'Корисничко име'}
              </label>
              <input
                id="username"
                className={styles.formInput}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder={isLogin ? 'Корисничко име или даночен број' : 'Изберете корисничко име'}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.formLabel}>
                Лозинка
              </label>
              <input
                id="password"
                className={styles.formInput}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={handlePasswordFocus}
                required
                placeholder="Внесете ја вашата лозинка"
              />
            </div>

            {!isLogin && showPasswordStrength && (
              <PasswordStrengthIndicator password={password} />
            )}

            {!isLogin && (
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.formLabel}>
                  Потврдете ја лозинката
                </label>
                <input
                  id="confirmPassword"
                  className={styles.formInput}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Внесете ја лозинката повторно"
                />
              </div>
            )}

            {isLogin && (
              <div className={styles.forgotPasswordContainer}>
                <a className={styles.forgotPasswordLink} href="/forgot-password">
                  Заборавена лозинка?
                </a>
              </div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Се обработува...' : (isLogin ? 'Најава' : 'Регистрација')}
            </button>
          </form>

          <div className={styles.loginDivider}>или</div>

          <div className={styles.oauthButtons}>
            <button
              className={styles.googleButton}
              type="button"
              onClick={handleGoogleLogin}
            >
              <svg className={styles.googleIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Најавете се со Google
            </button>
          </div>

          <div className={styles.toggleAuth}>
            <p>
              {isLogin ? 'Немате профил? ' : 'Веќе имате профил? '}
              <button
                className={styles.toggleButton}
                type="button"
                onClick={switchMode}
              >
                {isLogin ? 'Регистрирајте се' : 'Најавете се'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from '../../styles/website/Auth.module.css';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import PasswordStrengthIndicator from '../../components/common/PasswordStrengthIndicator';
import AuthMessage from '../../components/common/AuthMessage';
import { validatePassword, validatePasswordMatch, validateUsername } from '../../utils/passwordValidation';

const Login = () => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  // Plan is always standard at signup; admins/upgrades happen post-trial via the gate modal.
  const intendedPlan = 'standard';
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);

  // Email verification step
  const [verificationStep, setVerificationStep] = useState(false);
  const [verifyUserId, setVerifyUserId] = useState(null);
  const [verifyEmailAddr, setVerifyEmailAddr] = useState('');
  const [verifyCode, setVerifyCode] = useState('');

  const { currentUser, loginWithUsername, registerSimple, verifyEmailCode, resendVerificationCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if user is already logged in
  useEffect(() => {
    if (currentUser) {
      const params = new URLSearchParams(location.search);
      const redirect = params.get('redirect');
      const destination = redirect || location.state?.from?.pathname || '/terminal';
      navigate(destination, { replace: true });
    }

    if (location.state?.authError) {
      setError(t('login.sessionExpired', 'Сесијата истече. Ве молиме најавете се повторно.'));
    }
  }, [currentUser, navigate, location, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
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
            const params = new URLSearchParams(location.search);
            const redirect = params.get('redirect');
            const destination = redirect || location.state?.from?.pathname || '/terminal';
            navigate(destination, { replace: true });
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

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new Error('Внесете валидна е-пошта.');
        }

        const result = await registerSimple(username, password, intendedPlan || 'standard', email);
        if (result.success && result.requireEmailVerification) {
          setVerifyUserId(result.userId);
          setVerifyEmailAddr(result.email);
          setVerificationStep(true);
          setSuccess('Ви испративме 6-цифрен код на е-поштата.');
        } else if (result.success) {
          setSuccess('Успешна регистрација! Добредојдовте во Nexa Terminal!');
          setTimeout(() => {
            const params = new URLSearchParams(location.search);
            const redirect = params.get('redirect');
            const destination = redirect || '/terminal';
            navigate(destination);
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

  // Switch between login and signup
  const setMode = (login) => {
    if (login === isLogin) return;
    setIsLogin(login);
    setError('');
    setSuccess('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowPasswordStrength(false);
  };

  const handlePasswordFocus = () => {
    if (!isLogin) setShowPasswordStrength(true);
  };

  // Handle Google OAuth login
  const handleGoogleLogin = () => {
    const apiURL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    const googleAuthUrl = redirect
      ? `${apiURL}/auth/google?state=${encodeURIComponent(redirect)}`
      : `${apiURL}/auth/google`;
    window.location.href = googleAuthUrl;
  };

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <Link to="/" className={styles.backLink}>
          <span className={styles.backArrow} aria-hidden>←</span>
          Назад на Nexa
        </Link>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <img src="/nexa-logo-navbar.png" alt="Nexa" className={styles.logo} />
          <h1 className={styles.title}>
            {isLogin ? 'Добредојдовте назад' : 'Создадете профил'}
          </h1>
          <p className={styles.subtitle}>
            {isLogin
              ? 'Најавете се за да продолжите во Nexa Terminal'
              : 'Започнете со Nexa Terminal за неколку минути'}
          </p>

          {!isLogin && !verificationStep && (
            <div className={styles.trialPillWrap}>
              <span className={styles.trialPill}>🎁 8 дена бесплатно · без картичка</span>
            </div>
          )}

          {!verificationStep && (
            <div className={styles.segment} role="tablist" aria-label="Најава или регистрација">
              <button
                type="button"
                role="tab"
                aria-selected={isLogin}
                className={`${styles.segmentBtn} ${isLogin ? styles.segmentBtnActive : ''}`}
                onClick={() => setMode(true)}
              >
                Најава
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!isLogin}
                className={`${styles.segmentBtn} ${!isLogin ? styles.segmentBtnActive : ''}`}
                onClick={() => setMode(false)}
              >
                Регистрација
              </button>
            </div>
          )}

          <AuthMessage type="error" message={error} onClose={() => setError('')} />
          <AuthMessage type="success" message={success} onClose={() => setSuccess('')} />

          {verificationStep ? (
            <VerificationForm
              styles={styles}
              email={verifyEmailAddr}
              code={verifyCode}
              setCode={setVerifyCode}
              loading={loading}
              onSubmit={async () => {
                setError('');
                if (!/^\d{6}$/.test(verifyCode)) { setError('Кодот мора да биде 6 цифри.'); return; }
                setLoading(true);
                const res = await verifyEmailCode(verifyUserId, verifyCode);
                setLoading(false);
                if (res.success) {
                  setSuccess('Е-поштата е потврдена. Добредојдовте!');
                  const params = new URLSearchParams(location.search);
                  const redirect = params.get('redirect') || '/terminal';
                  setTimeout(() => navigate(redirect), 1000);
                } else {
                  setError(res.error || 'Невалиден код.');
                }
              }}
              onResend={async () => {
                setError('');
                const res = await resendVerificationCode(verifyUserId);
                if (res.success) setSuccess('Нов код е испратен.');
                else setError(res.error || 'Грешка.');
              }}
              onCancel={() => {
                setVerificationStep(false);
                setVerifyCode('');
                setVerifyUserId(null);
                setVerifyEmailAddr('');
              }}
            />
          ) : (
            <>
              {/* Google OAuth first — lowest-friction path */}
              <button
                className={styles.google}
                onClick={handleGoogleLogin}
                type="button"
                disabled={loading}
              >
                <svg className={styles.googleIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {isLogin ? 'Најавете се со Google' : 'Регистрирајте се со Google'}
              </button>

              <div className={styles.divider}>или</div>

              <form className={styles.form} onSubmit={handleSubmit}>
                {/* Email — required at signup */}
                {!isLogin && (
                  <div className={styles.field}>
                    <label htmlFor="email" className={styles.label}>Е-пошта</label>
                    <input
                      type="email"
                      id="email"
                      className={styles.input}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="vie@vasata-firma.mk"
                    />
                    <p className={styles.hint}>Ќе Ви испратиме 6-цифрен код за потврда на оваа е-пошта.</p>
                  </div>
                )}

                {/* Username */}
                <div className={styles.field}>
                  <label htmlFor="username" className={styles.label}>
                    {isLogin ? 'Корисничко име или даночен број' : 'Корисничко име'}
                  </label>
                  <input
                    type="text"
                    id="username"
                    className={styles.input}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder={isLogin ? 'Корисничко име или даночен број' : 'Изберете корисничко име'}
                  />
                </div>

                {/* Password */}
                <div className={styles.field}>
                  <label htmlFor="password" className={styles.label}>Лозинка</label>
                  <div className={styles.inputWrap}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      className={styles.input}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={handlePasswordFocus}
                      required
                      placeholder={isLogin ? 'Внесете ја вашата лозинка' : 'Создајте безбедна лозинка'}
                    />
                    <button
                      type="button"
                      className={styles.eye}
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Сокриј лозинка' : 'Прикажи лозинка'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>

                  {!isLogin && showPasswordStrength && (
                    <PasswordStrengthIndicator password={password} showRequirements={true} />
                  )}
                </div>

                {/* Confirm password — signup only */}
                {!isLogin && (
                  <div className={styles.field}>
                    <label htmlFor="confirmPassword" className={styles.label}>Потврдете ја лозинката</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      className={styles.input}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Повторете ја лозинката"
                    />
                    {confirmPassword && (
                      <p className={`${styles.passwordMatch} ${password === confirmPassword ? styles.match : styles.noMatch}`}>
                        {password === confirmPassword ? '✓ Лозинките се совпаѓаат' : '✗ Лозинките не се совпаѓаат'}
                      </p>
                    )}
                  </div>
                )}

                {/* Forgot password — login only */}
                {isLogin && (
                  <div className={styles.forgotRow}>
                    <Link to="/forgot-password" className={styles.forgotLink}>Заборавена лозинка?</Link>
                  </div>
                )}

                <button type="submit" className={styles.submit} disabled={loading}>
                  {loading ? (
                    <>
                      <span className={styles.spinner}></span>
                      {isLogin ? 'Се најавувате...' : 'Се регистрирате...'}
                    </>
                  ) : (
                    isLogin ? 'Најава' : 'Регистрација'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>© 2026 Nexa Terminal</span>
          <span className={styles.footerDot}>•</span>
          <a href="/privacy-policy" className={styles.footerLink}>Политика за приватност</a>
          <span className={styles.footerDot}>•</span>
          <a href="/terms-conditions" className={styles.footerLink}>Услови за користење</a>
          <span className={styles.footerDot}>•</span>
          <a href="mailto:info@nexa.mk" className={styles.footerLink}>info@nexa.mk</a>
        </div>
      </footer>
    </div>
  );
};

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

function VerificationForm({ styles, email, code, setCode, loading, onSubmit, onResend, onCancel }) {
  return (
    <div className={styles.verify}>
      <p className={styles.verifyText}>
        Внесете го <strong>6-цифрениот код</strong> кој го испративме на <strong>{email}</strong>.
      </p>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="123456"
        className={styles.codeInput}
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={loading || code.length !== 6}
        className={styles.submit}
      >
        {loading ? (
          <>
            <span className={styles.spinner}></span>
            Се проверува…
          </>
        ) : (
          'Потврди и продолжи'
        )}
      </button>
      <div className={styles.verifyActions}>
        <button type="button" onClick={onResend} className={styles.linkBtn}>Прати нов код</button>
        <button type="button" onClick={onCancel} className={`${styles.linkBtn} ${styles.linkBtnMuted}`}>Откажи</button>
      </div>
    </div>
  );
}

export default Login;

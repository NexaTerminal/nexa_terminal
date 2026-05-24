import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from '../../styles/website/Login.module.css';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import TypewriterFeatures from '../../components/website/TypewriterFeatures';
import PasswordStrengthIndicator from '../../components/common/PasswordStrengthIndicator';
import AuthMessage from '../../components/common/AuthMessage';
import { validatePassword, validatePasswordMatch, validateUsername } from '../../utils/passwordValidation';
import SimpleNavbar from '../../components/common/SimpleNavbar';

const Login = () => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  // Plan is always standard at signup; admins/upgrades happen post-trial via the gate modal.
  const intendedPlan = 'standard';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  
  const { currentUser, login, loginWithUsername, registerSimple } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if user is already logged in
  useEffect(() => {
    if (currentUser) {
      // Check URL query params first, then location state
      const params = new URLSearchParams(location.search);
      const redirect = params.get('redirect');
      const destination = redirect || location.state?.from?.pathname || '/terminal';
      navigate(destination, { replace: true });
    }

    // Display error if redirected due to authentication error
    if (location.state?.authError) {
      setError(t('login.sessionExpired', 'Your session has expired. Please log in again.'));
    }
  }, [currentUser, navigate, location, t]);

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
            // Check URL query params first, then location state
            const params = new URLSearchParams(location.search);
            const redirect = params.get('redirect');
            const destination = redirect || location.state?.from?.pathname || '/terminal';
            navigate(destination, { replace: true });
          }, 1000);
        } else {
          // Handle specific login errors
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
        
        const result = await registerSimple(username, password, intendedPlan || 'standard');
        if (result.success) {
          setSuccess('Успешна регистрација! Добредојдовте во Nexa Terminal!');
          setTimeout(() => {
            // Check URL query params first, then default to /terminal
            const params = new URLSearchParams(location.search);
            const redirect = params.get('redirect');
            const destination = redirect || '/terminal';
            navigate(destination);
          }, 1500);
        } else {
          // Handle specific registration errors
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

  // Handle form mode switching
  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setShowPasswordStrength(false);
  };

  // Handle password input focus for registration
  const handlePasswordFocus = () => {
    if (!isLogin) {
      setShowPasswordStrength(true);
    }
  };

  // Handle Google OAuth login
  const handleGoogleLogin = () => {
    const apiURL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

    // Extract redirect parameter from URL query params
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');

    // Pass redirect as state parameter to preserve it through OAuth flow
    const googleAuthUrl = redirect
      ? `${apiURL}/auth/google?state=${encodeURIComponent(redirect)}`
      : `${apiURL}/auth/google`;

    window.location.href = googleAuthUrl;
  };

  return (
    <>
      {/* Simple Navbar at the very top */}
      <SimpleNavbar />

      <div className={styles.loginPage}>
        {/* Top Bar with Language Selector - DISABLED FOR NOW */}
      {/* <div className={styles.topBar}>
        <div className={styles.topLeftControls}>
          <div className={styles.languageSelector}>
            <button onClick={() => i18n.changeLanguage('en')} className={i18n.language === 'en' ? styles.activeLang : ''}>EN</button>
            <span className={styles.langDivider}>|</span>
            <button onClick={() => i18n.changeLanguage('mk')} className={i18n.language === 'mk' ? styles.activeLang : ''}>MK</button>
          </div>
        </div>
      </div> */}

      {/* Main Split Layout */}
      <div className={styles.mainContainer}>
        {/* Left Side - Business Content (3/5) */}
        <div className={styles.businessContent}>
          {/* Simple Hero Section */}
          <section className={styles.heroSection}>
            <div className={styles.logoContainer}>
              <img 
                src="/nexa-logo-navbar.png" 
                alt="Nexa" 
                className={styles.nexaLogo}
              />
            </div>
            {/* <h1 className={styles.nexaTitle}>{t('login.nexaTitle', 'Nexa')}</h1> */}
          </section>

          {/* What Nexa Does Section */}
          <section className={styles.whatSection}>
            <h2 className={styles.sectionTitle}>
              {t('home.whatTitle_new', 'Efficiency Starts Here.')} {/* Changed translation key and default text */}
            </h2>
            {/* Replace the grid with the TypewriterFeatures component */}
            <div className={styles.whatGridContainer}> {/* Added a container for better styling if needed */}
              <TypewriterFeatures />
            </div>
            {/* Original grid commented out
            <div className={styles.whatGrid}>
              <div className={styles.whatCard}>
                <span className={styles.whatIcon}>📄</span>
                <span className={styles.whatText}>{t('home.feature1', 'Smart Documents')}</span>
              </div>
              
              <div className={styles.whatCard}>
                <span className={styles.whatIcon}>🤖</span>
                <span className={styles.whatText}>{t('home.feature2', 'AI Assistant')}</span>
              </div>
              
              <div className={styles.whatCard}>
                <span className={styles.whatIcon}>📊</span>
                <span className={styles.whatText}>{t('home.feature3', 'Analytics')}</span>
              </div>
            </div>
            */}
          </section>

          {/* Sample Content Section - REMOVED */}
          {/* 
          <section className={styles.sampleSection}>
            <h2 className={styles.sectionTitle}>
              {t('home.sampleTitle', 'See Nexa in Action')}
            </h2>
            <div className={styles.sampleDemo}>
              <div className={styles.demoInput}>
                <span className={styles.demoLabel}>{t('home.demoInput', 'You ask:')}</span>
                <p className={styles.demoText}>"{t('home.demoQuestion', 'Create a service agreement for my consulting business')}"</p>
              </div>
              <div className={styles.demoArrow}>→</div>
              <div className={styles.demoOutput}>
                <span className={styles.demoLabel}>{t('home.demoOutput', 'Nexa delivers:')}</span>
                <p className={styles.demoText}>{t('home.demoResult', 'Professional service agreement with your business details, payment terms, and legal clauses - ready in 30 seconds.')}</p>
              </div>
            </div>
          </section>
          */}
        </div>

        {/* Right Side - Login Form (2/5) */}
        <div className={styles.loginSidebar}>
          <div className={styles.loginContainer}>
            <h1>{isLogin ? t('') : t('login.createAccount')}</h1>
            
            <div className={styles.loginCard}>
              
              {/* Enhanced error and success messages */}
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
                {!isLogin && (
                  <p className={styles.trialNote}>
                    🎁 8 дена бесплатен пристап. Без картичка, без обврска.
                  </p>
                )}
                {/* Username field */}
                <div className={styles.formGroup}>
                  <label htmlFor="username" className={styles.formLabel}>
                    {isLogin ? 'Корисничко име или даночен број' : 'Корисничко име'}
                  </label>
                  <input
                    type="text"
                    id="username"
                    className={styles.formInput}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder={
                      isLogin
                        ? 'Корисничко име или даночен број'
                        : 'Изберете корисничко име'
                    }
                  />
                </div>

                {/* Password field */}
                <div className={styles.formGroup}>
                  <label htmlFor="password" className={styles.formLabel}>
                    Лозинка
                  </label>
                  <input
                    type="password"
                    id="password"
                    className={styles.formInput}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={handlePasswordFocus}
                    required
                    placeholder={isLogin ? 'Внесете ја вашата лозинка' : 'Создајте безбедна лозинка'}
                  />
                  
                  {/* Password strength indicator for registration */}
                  {!isLogin && showPasswordStrength && (
                    <PasswordStrengthIndicator 
                      password={password}
                      showRequirements={true}
                    />
                  )}
                </div>

                {/* Confirm password field for registration only */}
                {!isLogin && (
                  <div className={styles.formGroup}>
                    <label htmlFor="confirmPassword" className={styles.formLabel}>
                      Потврдете ја лозинката
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      className={styles.formInput}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Повторете ја лозинката"
                    />
                    
                    {/* Password match indicator */}
                    {confirmPassword && (
                      <div className={`${styles.passwordMatch} ${
                        password === confirmPassword ? styles.match : styles.noMatch
                      }`}>
                        {password === confirmPassword ? (
                          <span style={{color: 'var(--color-success)'}}>✓ Лозинките се совпаѓаат</span>
                        ) : (
                          <span style={{color: 'var(--color-error)'}}>✗ Лозинките не се совпаѓаат</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Forgot Password Link (only shown during login) */}
                {isLogin && (
                  <div className={styles.forgotPasswordContainer}>
                    <Link to="/forgot-password" className={styles.forgotPasswordLink}>
                      Заборавена лозинка?
                    </Link>
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className={styles.loadingSpinner}></span>
                      {isLogin ? 'Се најавувате...' : 'Се регистрирате...'}
                    </>
                  ) : (
                    isLogin ? 'Најава' : 'Регистрација'
                  )}
                </button>
              </form>

              {/* Login Divider */}
              <div className={styles.loginDivider}>или</div>

              {/* Google OAuth Button */}
              <div className={styles.oauthButtons}>
                <button
                  className={styles.googleButton}
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
              </div>

              <div className={styles.toggleAuth}>
                <p>
                  {isLogin ? (
                    <>
                      Немате профил?{' '}
                      <button 
                        onClick={switchMode}
                        className={styles.toggleButton}
                        type="button"
                      >
                        Регистрирајте се
                      </button>
                    </>
                  ) : (
                    <>
                      Веќе имате профил?{' '}
                      <button 
                        onClick={switchMode}
                        className={styles.toggleButton}
                        type="button"
                      >
                        Најавете се
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal Footer */}
      <footer className={styles.minimalFooter}>
        <div className={styles.footerContent}>
          <span className={styles.footerText}>© 2026 Nexa Terminal. Сите права задржани.</span>
          <div className={styles.footerLinks}>
            <a href="/privacy-policy" className={styles.footerLink}>Политика за приватност</a>
            <span className={styles.footerDivider}>•</span>
            <a href="/terms-conditions" className={styles.footerLink}>Услови за користење</a>
            <span className={styles.footerDivider}>•</span>
            <a href="/blog" className={styles.footerLink}>Блог</a>
            <span className={styles.footerDivider}>•</span>
            <a href="/about" className={styles.footerLink}>Повеќе</a>
            <span className={styles.footerDivider}>•</span>
            <a href="mailto:info@nexa.mk" className={styles.footerLink}>info@nexa.mk</a>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};

export default Login;

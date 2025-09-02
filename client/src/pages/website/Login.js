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

const Login = () => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
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
      const destination = location.state?.from?.pathname || '/terminal';
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
          throw new Error('Корисничкото име е задолжително');
        }
        if (!password) {
          throw new Error('Лозинката е задолжителна');
        }
        
        const result = await loginWithUsername(username, password);
        
        if (result.success) {
          setSuccess('Успешна најава! Пренасочување...');
          setTimeout(() => {
            const destination = location.state?.from?.pathname || '/terminal';
            navigate(destination, { replace: true });
          }, 1000);
        } else {
          // Handle specific login errors
          const errorMessage = result.error || 'Неуспешна најава';
          if (errorMessage.includes('Invalid credentials') || errorMessage.includes('password') || errorMessage.includes('лозинка')) {
            setError('Неточна лозинка. Ве молиме проверете ја лозинката и обидете се повторно.');
          } else if (errorMessage.includes('User not found') || errorMessage.includes('username') || errorMessage.includes('корисник')) {
            setError('Корисничкото име не постои. Проверете го корисничкото име или се регистрирајте.');
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
            navigate('/terminal');
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

  return (
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
                {/* Username field */}
                <div className={styles.formGroup}>
                  <label htmlFor="username" className={styles.formLabel}>
                    Корисничко име
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
                        ? 'Внесете го вашето корисничко име'
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
              
              {/* Login Divider - REMOVED */}
              {/* <div className={styles.loginDivider}>{t('login.or')}</div> */}
              
              {/* OAuth Buttons - REMOVED */}
              {/*
              <div className={styles.oauthButtons}>
                <button 
                  className={styles.oauthButton}
                  onClick={() => handleOAuthLogin('google')}
                >
                  {t('login.continueWith')} Google
                </button>
                
                <button 
                  className={styles.oauthButton}
                  onClick={() => handleOAuthLogin('linkedin')}
                >
                  {t('login.continueWith')} LinkedIn
                </button>
              </div>
              */}
              
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
    </div>
  );
};

export default Login;

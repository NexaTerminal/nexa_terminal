import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from '../../styles/website/Login.module.css';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import TypewriterFeatures from '../../components/website/TypewriterFeatures'; // Import the new component

const Login = () => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
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
    setLoading(true);
    
    try {
      if (isLogin) {
        // Always use loginWithUsername for login
        if (!username) {
          // If username is empty, try to use email as username, or show error
          // For now, let's enforce username for login as per simplified flow
          throw new Error(t('login.usernameRequired', 'Username is required'));
        }
        const result = await loginWithUsername(username, password);
        
        if (result.success) {
          // Navigate to the previous page or terminal
          const destination = location.state?.from?.pathname || '/terminal';
          navigate(destination, { replace: true });
        } else {
          setError(result.error || t('login.loginFailedError', 'Login failed. Please check your credentials or try again.'));
        }
      } else {
        // Simplified registration with just username and password
        if (!username) {
          throw new Error(t('login.usernameRequired', 'Username is required'));
        }
        if (username.length < 3) {
          throw new Error(t('login.usernameMinLength', 'Username must be at least 3 characters'));
        }
        
        const result = await registerSimple(username, password);
        if (result.success) {
          // Navigate directly to terminal after successful registration
          navigate('/terminal');
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      {/* Top Bar with Language Selector */}
      <div className={styles.topBar}>
        <div className={styles.topLeftControls}>
          <div className={styles.languageSelector}>
            <button onClick={() => i18n.changeLanguage('en')} className={i18n.language === 'en' ? styles.activeLang : ''}>EN</button>
            <span className={styles.langDivider}>|</span>
            <button onClick={() => i18n.changeLanguage('mk')} className={i18n.language === 'mk' ? styles.activeLang : ''}>MK</button>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className={styles.mainContainer}>
        {/* Left Side - Business Content (3/5) */}
        <div className={styles.businessContent}>
          {/* Simple Hero Section */}
          <section className={styles.heroSection}>
            <h1 className={styles.nexaTitle}>{t('login.nexaTitle', 'Nexa')}</h1>
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
  
              
              {error && <div className={styles.errorMessage}>{error}</div>}
              
              <form className={styles.loginForm} onSubmit={handleSubmit}>
                {/* Username field - shown for signup or optionally for login */}
                <div className={styles.formGroup}>
                  <label htmlFor="username" className={styles.formLabel}>
                    {isLogin 
                      ? t('login.username', 'Username') // Changed label for login
                      : t('login.username', 'Username')
                    }
                  </label>
                  <input
                    type="text"
                    id="username"
                    className={styles.formInput}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required // Username is now always required for both login and signup
                    placeholder={
                      isLogin
                        ? t('login.usernameRequiredPlaceholder', 'Enter your username') // Changed placeholder
                        : t('login.usernameChoosePlaceholder', 'Choose a username')
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="password" className={styles.formLabel}>{t('login.password', 'Password')}</label>
                  <input
                    type="password"
                    id="password"
                    className={styles.formInput}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={t('login.passwordPlaceholder', 'Enter your password')}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? t('login.processing') : isLogin ? t('login.signIn') : t('login.signUp')}
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
                      {t('login.dontHaveAccount')}{' '}
                      <button 
                        onClick={() => setIsLogin(false)}
                        className={styles.toggleButton}
                      >
                        {t('login.signUp')}
                      </button>
                    </>
                  ) : (
                    <>
                      {t('login.alreadyHaveAccount')}{' '}
                      <button 
                        onClick={() => setIsLogin(true)}
                        className={styles.toggleButton}
                      >
                        {t('login.signIn')}
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

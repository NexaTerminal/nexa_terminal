import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from '../../styles/website/LandingPage.new.css';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';

const LandingPage = () => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
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
        // Try username login first, fallback to email if username is not provided
        const result = username 
          ? await loginWithUsername(username, password)
          : await login(email, password);
        
        if (result.success) {
          // Navigate to the previous page or terminal
          const destination = location.state?.from?.pathname || '/terminal';
          navigate(destination, { replace: true });
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const calculateReadTime = (text) => {
    if (!text) return '3 min read';
    const wordsPerMinute = 200;
    const wordCount = text.split(' ').length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readTime} min read`;
  };

  return (
    <div className={styles.landingPage}>
      {/* Top Bar with Language Selector */}
      <div className={styles.topBar}>
        <div className={styles.languageSelector}>
          <button onClick={() => i18n.changeLanguage('en')} className={i18n.language === 'en' ? styles.activeLang : ''}>EN</button>
          <span className={styles.langDivider}>|</span>
          <button onClick={() => i18n.changeLanguage('mk')} className={i18n.language === 'mk' ? styles.activeLang : ''}>MK</button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className={styles.mainContainer}>
        {/* Left Side - Business Content (3/5) */}
        <div className={styles.businessContent}>
          {/* Simple Hero Section */}
          <section className={styles.heroSection}>
            <h1 className={styles.nexaTitle}>Nexa</h1>
          </section>

          {/* What Nexa Does Section */}
          <section className={styles.whatSection}>
            <h2 className={styles.sectionTitle}>
              {t('home.whatTitle', 'What Nexa Does for Your Business')}
            </h2>
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
          </section>

          {/* Sample Content Section */}
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
        </div>

        {/* Right Side - Login Form (2/5) */}
        <div className={styles.loginSidebar}>
          <div className={styles.loginContainer}>
            {error && <div className={styles.errorMessage}>{error}</div>}
            
            <form className={styles.loginForm} onSubmit={handleSubmit}>
              {/* Username field - shown for signup or optionally for login */}
              <div className={styles.formGroup}>
                <label htmlFor="username" className={styles.formLabel}>
                  {isLogin 
                    ? t('login.usernameOrEmail', 'Username (optional)')
                    : t('login.username', 'Username')
                  }
                </label>
                <input
                  type="text"
                  id="username"
                  className={styles.formInput}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isLogin}
                  placeholder={isLogin 
                    ? t('login.usernamePlaceholder', 'Enter username or leave empty to use email')
                    : t('login.usernameRequiredPlaceholder', 'Choose a username')
                  }
                />
              </div>

              {/* Email field - shown for login when username is not provided */}
              {isLogin && (
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.formLabel}>
                    {t('login.email', 'Email')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    className={styles.formInput}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required={!username}
                    placeholder={t('login.emailPlaceholder', 'Enter your email address')}
                  />
                </div>
              )}

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
                {loading ? t('login.loading', 'Loading...') : (isLogin ? t('login.signIn', 'Sign In') : t('login.signUp', 'Sign Up'))}
              </button>
            </form>

            <div className={styles.toggleAuth}>
              <p>
                {isLogin ? t('login.noAccount', "Don't have an account?") : t('login.haveAccount', 'Already have an account?')}
                <button 
                  type="button" 
                  onClick={() => setIsLogin(!isLogin)}
                  className={styles.toggleButton}
                >
                  {isLogin ? t('login.signUp', 'Sign Up') : t('login.signIn', 'Sign In')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>Nexa</div>
            <p>{t('footer.description', 'Empowering small businesses with AI-driven solutions.')}</p>
          </div>
          
          <div className={styles.footerLinks}>
            <div className={styles.footerSection}>
              <h3>{t('footer.product', 'Product')}</h3>
              <ul>
                <li><a href="#features">{t('footer.features', 'Features')}</a></li>
                <li><a href="#pricing">{t('footer.pricing', 'Pricing')}</a></li>
              </ul>
            </div>
            
            <div className={styles.footerSection}>
              <h3>{t('footer.support', 'Support')}</h3>
              <ul>
                <li><a href="#help">{t('footer.help', 'Help Center')}</a></li>
                <li><a href="#contact">{t('footer.contact', 'Contact Us')}</a></li>
                <li><a href="#privacy">{t('footer.privacy', 'Privacy Policy')}</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <p>&copy; 2025 Nexa. {t('footer.rights', 'All rights reserved.')}</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

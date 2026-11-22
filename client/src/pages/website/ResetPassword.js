import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import styles from '../../styles/website/Login.module.css';
import AuthMessage from '../../components/common/AuthMessage';
import PasswordStrengthIndicator from '../../components/common/PasswordStrengthIndicator';
import ApiService from '../../services/api';
import { validatePassword } from '../../utils/passwordValidation';
import PublicFooter from '../../components/common/PublicFooter';
import SEOHelmet from '../../components/seo/SEOHelmet';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  
  const token = searchParams.get('token');
  const uid = searchParams.get('uid');

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token || !uid) {
        setError('Невалиден линк за ресетирање на лозинката');
        setValidating(false);
        return;
      }

      try {
        const response = await ApiService.request(`/auth/validate-reset-token?token=${encodeURIComponent(token)}&uid=${encodeURIComponent(uid)}`);
        
        if (response.valid) {
          setTokenValid(true);
        } else {
          setError(response.message || 'Линкот за ресетирање е истечен или невалиден');
        }
      } catch (error) {
        setError('Се случи грешка при валидацијата на токенот');
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token, uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error('Лозинката не ги исполнува безбедносните барања');
      }

      // Check password match
      if (password !== confirmPassword) {
        throw new Error('Лозинките не се совпаѓаат');
      }

      const response = await ApiService.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          uid,
          newPassword: password,
          confirmPassword
        })
      });

      if (response.success) {
        setSuccess('Лозинката е успешно променета! Пренасочување кон најава...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.message || 'Се случи грешка при промена на лозинката');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle password input focus
  const handlePasswordFocus = () => {
    setShowPasswordStrength(true);
  };

  if (validating) {
    return (
      <div className={styles.loginPage}>
        <SEOHelmet title="Нова лозинка · Nexa" canonical="/reset-password" noIndex />
        <div className={styles.mainContainer}>
          <div className={styles.loginSidebar}>
            <div className={styles.loginContainer}>
              <div className={styles.loginCard}>
                <div className={styles.validatingToken}>
                  <span className={styles.loadingSpinner}></span>
                  <p>Валидирање на токенот...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className={styles.loginPage}>
        <SEOHelmet title="Нова лозинка · Nexa" canonical="/reset-password" noIndex />
        <div className={styles.mainContainer}>
          <div className={styles.loginSidebar}>
            <div className={styles.loginContainer}>
              <h1>Невалиден линк</h1>
              
              <div className={styles.loginCard}>
                <AuthMessage 
                  type="error"
                  message={error}
                  onClose={() => setError('')}
                />
                
                <div className={styles.invalidTokenMessage}>
                  <div className={styles.invalidTokenIcon}>❌</div>
                  <p>
                    Линкот за ресетирање на лозинката е истечен или невалиден.
                  </p>
                  <p>
                    Ве молиме побарајте нов линк за ресетирање.
                  </p>
                </div>
                
                <div className={styles.tokenActions}>
                  <Link to="/forgot-password" className={styles.submitButton}>
                    Побарајте нов линк
                  </Link>
                  
                  <Link to="/login" className={styles.backToLoginLink}>
                    ← Назад кон најава
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginPage}>
        <SEOHelmet title="Нова лозинка · Nexa" canonical="/reset-password" noIndex />
      <div className={styles.mainContainer}>
        {/* Left Side - Business Content */}
        <div className={styles.businessContent}>
          <section className={styles.heroSection}>
            <div className={styles.logoContainer}>
              <img 
                src="/nexa-logo-navbar.png" 
                alt="Nexa" 
                className={styles.nexaLogo}
              />
            </div>
          </section>

          <section className={styles.whatSection}>
            <h2 className={styles.sectionTitle}>
              Создајте нова безбедна лозинка
            </h2>
            <div className={styles.resetPasswordInfo}>
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>🔒</span>
                <span className={styles.infoText}>Безбедност пред се</span>
              </div>
              
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>💪</span>
                <span className={styles.infoText}>Јака лозинка - сигурен профил</span>
              </div>
              
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>✅</span>
                <span className={styles.infoText}>Еднократна промена</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Side - Reset Password Form */}
        <div className={styles.loginSidebar}>
          <div className={styles.loginContainer}>
            <h1>Ресетирај лозинка</h1>
            
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
                <div className={styles.resetPasswordDescription}>
                  <p>Внесете ја вашата нова лозинка. Осигурајте се дека е безбедна и тешка за погодување.</p>
                </div>

                {/* New Password field */}
                <div className={styles.formGroup}>
                  <label htmlFor="password" className={styles.formLabel}>
                    Нова лозинка
                  </label>
                  <input
                    type="password"
                    id="password"
                    className={styles.formInput}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={handlePasswordFocus}
                    placeholder="Создајте безбедна лозинка"
                    required
                  />
                  
                  {/* Password strength indicator */}
                  {showPasswordStrength && (
                    <PasswordStrengthIndicator 
                      password={password}
                      showRequirements={true}
                    />
                  )}
                </div>

                {/* Confirm Password field */}
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
                    placeholder="Повторете ја новата лозинка"
                    required
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
                
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className={styles.loadingSpinner}></span>
                      Се менува лозинката...
                    </>
                  ) : (
                    'Постави нова лозинка'
                  )}
                </button>
              </form>
              
              <div className={styles.backToLogin}>
                <Link to="/login" className={styles.backToLoginLink}>
                  ← Назад кон најава
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};

export default ResetPassword;
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/website/Login.module.css';
import AuthMessage from '../../components/common/AuthMessage';
import ApiService from '../../services/api';
import PublicFooter from '../../components/common/PublicFooter';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!email) {
        throw new Error('Email адресата е задолжителна');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Внесете валидна email адреса');
      }

      const response = await ApiService.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      });

      if (response.success) {
        setSuccess('Успешно пратен линк за ресетирање на лозинката на вашата email адреса!');
        setEmailSent(true);
      } else {
        setError(response.message || 'Се случи грешка при пракање на email-от');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
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
              Вратете го пристапот до вашиот профил
            </h2>
            <div className={styles.forgotPasswordInfo}>
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>🔐</span>
                <span className={styles.infoText}>Безбедно ресетирање на лозинката</span>
              </div>
              
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>📧</span>
                <span className={styles.infoText}>Линк за ресетирање преку email</span>
              </div>
              
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>⚡</span>
                <span className={styles.infoText}>Брзо и едноставно</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Side - Forgot Password Form */}
        <div className={styles.loginSidebar}>
          <div className={styles.loginContainer}>
            <h1>Заборавена лозинка</h1>
            
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

              {!emailSent ? (
                <form className={styles.loginForm} onSubmit={handleSubmit}>
                  <div className={styles.forgotPasswordDescription}>
                    <p>Внесете ја вашата email адреса и ќе ви пратиме линк за ресетирање на лозинката.</p>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.formLabel}>
                      Email адреса
                    </label>
                    <input
                      type="email"
                      id="email"
                      className={styles.formInput}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Внесете ја вашата email адреса"
                      required
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className={styles.submitButton}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className={styles.loadingSpinner}></span>
                        Се праќа...
                      </>
                    ) : (
                      'Прати линк за ресетирање'
                    )}
                  </button>
                </form>
              ) : (
                <div className={styles.emailSentMessage}>
                  <div className={styles.emailSentIcon}>📧</div>
                  <h3>Email пратен!</h3>
                  <p>
                    Проверете ја вашата email адреса <strong>{email}</strong> за линкот за ресетирање на лозинката.
                  </p>
                  <p className={styles.emailInstructions}>
                    Ако не го видите email-от, проверете ја и spam папката. Линкот е валиден 1 час.
                  </p>
                  
                  <button 
                    onClick={() => {
                      setEmailSent(false);
                      setEmail('');
                      setSuccess('');
                    }}
                    className={styles.resendButton}
                  >
                    Прати повторно
                  </button>
                </div>
              )}
              
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

export default ForgotPassword;
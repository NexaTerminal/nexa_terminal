import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styles from '../styles/VerificationResult.module.css';

const VerificationResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  
  const success = searchParams.get('success') === 'true';
  const error = searchParams.get('error');
  const company = searchParams.get('company');

  useEffect(() => {
    // Auto redirect after 5 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/terminal');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'invalid_token':
        return 'Врската за верификација е невалидна или истечена. Ве молиме побарајте нова врска за верификација.';
      case 'server_error':
        return 'Се случи техничка грешка. Ве молиме обидете се повторно подоцна.';
      default:
        return 'Се случи непозната грешка при верификацијата.';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {success ? (
          <div className={styles.successCard}>
            <div className={styles.iconContainer}>
              <div className={styles.successIcon}>✅</div>
            </div>
            
            <h1 className={styles.title}>Email Адресата е Успешно Верификувана!</h1>
            
            {company && (
              <p className={styles.subtitle}>
                Честитки! Email адресата на <strong>{decodeURIComponent(company)}</strong> е потврдена.
              </p>
            )}
            
            <div className={styles.infoBox}>
              <h3>🎉 Добредојдовте во Nexa Terminal!</h3>
              <ul className={styles.nextSteps}>
                <li>✅ Вашата компанија е успешно верификувана</li>
                <li>🚀 Имате пристап до сите премиум функции</li>
                <li>📄 Можете да генерирате правни документи</li>
                <li>🤖 AI асистентот е достапен за користење</li>
              </ul>
            </div>
            
            <div className={styles.features}>
              <h4>🌟 Достапни функции:</h4>
              <div className={styles.featuresList}>
                <span className={styles.feature}>📄 Автоматско генерирање документи</span>
                <span className={styles.feature}>🤖 AI правен асистент</span>
                <span className={styles.feature}>📱 Социјални мрежи објави</span>
                <span className={styles.feature}>💼 Сите премиум алатки</span>
              </div>
            </div>
            
            <div className={styles.actionSection}>
              <button 
                onClick={() => navigate('/terminal')} 
                className={styles.primaryButton}
              >
                Продолжи кон Nexa Terminal
              </button>
              
              <p className={styles.autoRedirect}>
                Автоматско пренасочување за {countdown} секунди...
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.errorCard}>
            <div className={styles.iconContainer}>
              <div className={styles.errorIcon}>❌</div>
            </div>
            
            <h1 className={styles.title}>Верификацијата не успеа</h1>
            
            <p className={styles.errorMessage}>
              {getErrorMessage(error)}
            </p>
            
            <div className={styles.infoBox}>
              <h3>🔧 Како да го решите проблемот:</h3>
              <ul className={styles.troubleshoot}>
                <li>Проверете дали врската е комплетна и не е прекинана</li>
                <li>Обидете се да го отворите линкот во нов прелистувач</li>
                <li>Ако врската е истечена, побарајте нова од профилната страница</li>
                <li>Контактирајте го тимот ако проблемот продолжува</li>
              </ul>
            </div>
            
            <div className={styles.actionSection}>
              <button 
                onClick={() => navigate('/terminal/verification')} 
                className={styles.primaryButton}
              >
                Идете на Профилна Страница
              </button>
              
              <button 
                onClick={() => navigate('/terminal')} 
                className={styles.secondaryButton}
              >
                Назад кон Dashboard
              </button>
              
              <p className={styles.autoRedirect}>
                Автоматско пренасочување за {countdown} секунди...
              </p>
            </div>
          </div>
        )}
        
        <div className={styles.footer}>
          <p>
            <strong>Nexa Terminal</strong> - Правна технологија за македонскиот бизнис
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificationResult;
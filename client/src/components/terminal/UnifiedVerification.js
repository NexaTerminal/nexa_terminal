import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import styles from '../../styles/terminal/UnifiedVerification.module.css';
import ApiService from '../../services/api';

const UnifiedVerification = () => {
  const { t } = useTranslation();
  const { currentUser: user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data for all required fields
  const [formData, setFormData] = useState({
    // Company Info
    companyName: '',
    address: '',
    taxNumber: '',
    businessActivity: '',
    // Personal/Manager Info
    companyManager: '',
    officialEmail: '',
    // Optional fields
    website: '',
    industry: '',
    role: '',
    description: ''
  });

  // Pre-fill form with existing user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        companyName: user.companyInfo?.companyName || '',
        address: user.companyInfo?.address || '',
        taxNumber: user.companyInfo?.taxNumber || '',
        businessActivity: user.companyInfo?.businessActivity || '',
        companyManager: user.companyManager || '',
        officialEmail: user.officialEmail || user.email || '',
        website: user.companyInfo?.website || '',
        industry: user.companyInfo?.industry || '',
        role: user.companyInfo?.role || '',
        description: user.companyInfo?.description || ''
      }));

      // Determine current step based on completion status
      const hasBasicInfo = user.companyInfo?.companyName && user.companyInfo?.address && user.companyInfo?.taxNumber;
      const hasEmailVerification = user.emailVerified;
      
      if (!hasBasicInfo) {
        setCurrentStep(1);
      } else if (!hasEmailVerification) {
        setCurrentStep(2);
      } else {
        setCurrentStep(3); // Completed
      }
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateStep1 = () => {
    const required = ['companyName', 'address', 'taxNumber', 'businessActivity', 'companyManager'];
    const missing = required.filter(field => !formData[field]?.trim());
    
    if (missing.length > 0) {
      setError('Ве молиме пополнете ги сите задолжителни полиња.');
      return false;
    }
    return true;
  };

  const handleStep1Submit = async () => {
    if (!validateStep1()) return;

    setLoading(true);
    setError('');

    try {
      const response = await ApiService.request('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          companyInfo: {
            companyName: formData.companyName,
            companyAddress: formData.address,
            companyTaxNumber: formData.taxNumber,
            businessActivity: formData.businessActivity,
            website: formData.website,
            industry: formData.industry,
            role: formData.role,
            description: formData.description
          },
          companyManager: formData.companyManager,
          officialEmail: formData.officialEmail
        })
      });

      await refreshUser(); // Refresh user data
      setCurrentStep(2);
      setSuccess('Профилот е успешно ажуриран!');
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.message || 'Грешка при ажурирање на профилот.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerification = async () => {
    if (!formData.officialEmail?.trim()) {
      setError('Ве молиме внесете службена email адреса.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await ApiService.request('/verification/send-verification-email', {
        method: 'POST',
        body: JSON.stringify({
          officialEmail: formData.officialEmail,
          companyName: formData.companyName,
          companyManager: formData.companyManager
        })
      });

      if (response.success) {
        setEmailSent(true);
        setSuccess(`Верификационен email е пратен на ${formData.officialEmail}`);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setError(error.message || 'Грешка при испраќање на верификационен email.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className={styles.step}>
      <div className={styles.stepHeader}>
        <div className={styles.stepNumber}>1</div>
        <div className={styles.stepTitle}>
          <h3>Информации за компанијата</h3>
          <p>Внесете ги основните информации за вашата компанија</p>
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>Име на компанија *</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleInputChange}
            placeholder="Внесете го името на компанијата"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Адреса на компанија *</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Улица, број, град"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Даночен број *</label>
          <input
            type="text"
            name="taxNumber"
            value={formData.taxNumber}
            onChange={handleInputChange}
            placeholder="Внесете го даночниот број"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Дејност на компанијата *</label>
          <input
            type="text"
            name="businessActivity"
            value={formData.businessActivity}
            onChange={handleInputChange}
            placeholder="Опишете ја дејноста"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Менаџер/Одговорно лице *</label>
          <input
            type="text"
            name="companyManager"
            value={formData.companyManager}
            onChange={handleInputChange}
            placeholder="Име и презиме на одговорното лице"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Веб-страница</label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            placeholder="https://example.com"
          />
        </div>
      </div>

      <div className={styles.stepActions}>
        <button 
          onClick={handleStep1Submit}
          disabled={loading}
          className={styles.primaryButton}
        >
          {loading ? 'Се зачувува...' : 'Продолжи'}
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className={styles.step}>
      <div className={styles.stepHeader}>
        <div className={styles.stepNumber}>2</div>
        <div className={styles.stepTitle}>
          <h3>Верификација на email</h3>
          <p>Потврдете ја вашата службена email адреса</p>
        </div>
      </div>

      <div className={styles.emailVerification}>
        <div className={styles.formGroup}>
          <label>Службена email адреса на компанијата *</label>
          <input
            type="email"
            name="officialEmail"
            value={formData.officialEmail}
            onChange={handleInputChange}
            placeholder="contact@yourcompany.com"
            required
          />
          <small className={styles.hint}>
            Ова треба да биде службената email адреса на вашата компанија
          </small>
        </div>

        {!emailSent ? (
          <div className={styles.stepActions}>
            <button 
              onClick={handleEmailVerification}
              disabled={loading}
              className={styles.primaryButton}
            >
              {loading ? 'Се испраќа...' : 'Испрати верификационен email'}
            </button>
          </div>
        ) : (
          <div className={styles.emailSentMessage}>
            <div className={styles.successIcon}>✅</div>
            <h4>Email е испратен!</h4>
            <p>Проверете ја вашата email адреса <strong>{formData.officialEmail}</strong> и кликнете на врската за верификација.</p>
            <button 
              onClick={() => setEmailSent(false)}
              className={styles.secondaryButton}
            >
              Испрати повторно
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className={styles.step}>
      <div className={styles.completionMessage}>
        <div className={styles.successIcon}>🎉</div>
        <h2>Честитки! Вашата компанија е верификувана!</h2>
        <p>Сега можете да ги користите сите функции на платформата:</p>
        
        <div className={styles.featuresList}>
          <div className={styles.feature}>✅ Автоматско генерирање на правни документи</div>
          <div className={styles.feature}>🤖 AI правен асистент</div>
          <div className={styles.feature}>📱 Објавување на социјални мрежи</div>
          <div className={styles.feature}>📊 Анализи и извештаи</div>
        </div>

        <div className={styles.stepActions}>
          <a href="/terminal" className={styles.primaryButton}>
            Продолжи кон платформата
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Верификација на компанија</h1>
        <div className={styles.progress}>
          <div className={`${styles.progressStep} ${currentStep >= 1 ? styles.active : ''} ${currentStep > 1 ? styles.completed : ''}`}>
            <span>1</span>
            <label>Информации</label>
          </div>
          <div className={`${styles.progressStep} ${currentStep >= 2 ? styles.active : ''} ${currentStep > 2 ? styles.completed : ''}`}>
            <span>2</span>
            <label>Email верификација</label>
          </div>
          <div className={`${styles.progressStep} ${currentStep >= 3 ? styles.active : ''}`}>
            <span>3</span>
            <label>Завршено</label>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {error && (
          <div className={styles.errorMessage}>
            <span className={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className={styles.successMessage}>
            <span className={styles.successIcon}>✅</span>
            {success}
          </div>
        )}

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>
    </div>
  );
};

export default UnifiedVerification;
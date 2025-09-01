import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Header from '../common/Header';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import styles from '../../styles/terminal/UnifiedVerification.module.css';
import dashboardStyles from '../../styles/terminal/Dashboard.module.css';
import ApiService from '../../services/api';

const CompanyVerificationSingle = () => {
  const { t } = useTranslation();
  const { currentUser: user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showSuccessOptions, setShowSuccessOptions] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data for all required fields
  const [formData, setFormData] = useState({
    // Required fields
    companyName: '',
    address: '',
    taxNumber: '',
    companyManager: '',
    officialEmail: '',
    // Optional fields
    businessActivity: '',
    website: '',
    industry: '',
    role: '',
    description: ''
  });

  // Pre-fill form with existing user data and refresh user context
  useEffect(() => {
    // Refresh user data to get latest verification status
    const refreshUserData = async () => {
      try {
        await refreshUser();
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    };
    
    refreshUserData();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        companyName: user.companyInfo?.companyName || '',
        address: user.companyInfo?.companyAddress || user.companyInfo?.address || '',
        taxNumber: user.companyInfo?.companyTaxNumber || user.companyInfo?.taxNumber || '',
        companyManager: user.companyManager || '',
        officialEmail: user.officialEmail || user.email || '',
        businessActivity: user.companyInfo?.businessActivity || '',
        website: user.companyInfo?.website || '',
        industry: user.companyInfo?.industry || '',
        role: user.companyInfo?.role || '',
        description: user.companyInfo?.description || ''
      }));

      // Check if email has been sent before
      setEmailSent(user.verificationStatus === 'email_sent' || false);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    const required = ['companyName', 'address', 'taxNumber', 'companyManager', 'officialEmail'];
    const missing = required.filter(field => !formData[field]?.trim());
    
    if (missing.length > 0) {
      setError('Ве молиме пополнете ги сите задолжителни полиња (име на компанија, адреса, даночен број, менаџер и email).');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.officialEmail)) {
      setError('Ве молиме внесете валидна email адреса.');
      return false;
    }

    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

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
          officialEmail: formData.officialEmail,
          profileComplete: true
        })
      });

      await refreshUser(); // Refresh user data
      setSuccess('Профилот е успешно ажуриран!');
      
      // Automatically send verification email after successful profile save
      if (formData.officialEmail?.trim()) {
        await sendVerificationEmailAutomatically();
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.message || 'Грешка при ажурирање на профилот.');
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationEmailAutomatically = async () => {
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
        setSuccess(`Профилот е ажуриран! Верификационен email е пратен на ${formData.officialEmail}. Проверете го вашиот inbox и кликнете на линкот за да ја завршите верификацијата.`);
        
        // Show success for 3 seconds, then show options
        setTimeout(() => {
          setShowSuccessOptions(true);
        }, 3000);
      }
    } catch (error) {
      console.error('Auto email verification error:', error);
      // Don't show error for automatic email - just log it
    }
  };

  const handleSendVerificationEmail = async () => {
    if (!formData.officialEmail?.trim()) {
      setError('Ве молиме внесете службена email адреса.');
      return;
    }

    // Save profile first if needed
    if (!success) {
      await handleSaveProfile();
      if (error) return; // Don't send email if profile save failed
    }

    setSendingEmail(true);
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
        setSuccess(`Верификационен email е пратен на ${formData.officialEmail}. Проверете го вашиот inbox и кликнете на линкот за верификација.`);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setError(error.message || 'Грешка при испраќање на верификационен email.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleResendEmail = async () => {
    setEmailSent(false);
    await handleSendVerificationEmail();
  };

  return (
    <div>
      <Header isTerminal={true} />
      
      <div className={dashboardStyles["dashboard-layout"]}>
        <Sidebar />
        
        <main className={dashboardStyles["dashboard-main"]}>
          <div className={styles.container}>
            <div className={styles.header}>
              <div className={styles.breadcrumb}>
                <button 
                  onClick={() => navigate('/terminal')} 
                  className={styles.backButton}
                >
                  ← Назад кон Dashboard
                </button>
              </div>
              <h2>Верификација на компанија</h2>
              <p>Внесете ги информациите за вашата компанија и потврдете го email-от за верификација</p>
        
        {user?.isVerified && (
          <div className={styles.verificationStatus}>
            <div className={styles.verifiedBadge}>
              ✅ Компанијата е верификувана
            </div>
            <p>Честитки! Вашата компанија е успешно верификувана и имате пристап до сите функции.</p>
            <div className={styles.accessFeatures}>
              <button 
                onClick={() => navigate('/terminal/documents')}
                className={styles.accessButton}
              >
                📄 Пристапи до Документи
              </button>
              <button 
                onClick={() => navigate('/terminal/ai-chat')}
                className={styles.accessButton}
              >
                🤖 Користи AI Асистент
              </button>
            </div>
          </div>
        )}
        
        {user?.profileComplete && !user?.isVerified && (
          <div className={styles.verificationStatus}>
            <div className={styles.pendingBadge}>
              ⏳ Чека верификација
            </div>
            <p>Профилот е комплетен, но треба да го потврдите email-ot. Проверете го вашиот inbox за верификационен линк.</p>
          </div>
        )}
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {success && (
        <div className={styles.success}>
          {success}
        </div>
      )}

      {!user?.isVerified && (
        <div className={styles.form}>
        <div className={styles.section}>
          <h3>Основни информации (задолжително)</h3>
          
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="companyName">Име на компанија *</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="Внесете го името на компанијата"
                required
              />
            </div>
            
            <div className={styles.field}>
              <label htmlFor="address">Адреса на компанија *</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Улица, број, град"
                required
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="taxNumber">Даночен број *</label>
              <input
                type="text"
                id="taxNumber"
                name="taxNumber"
                value={formData.taxNumber}
                onChange={handleInputChange}
                placeholder="Внесете го даночниот број"
                required
              />
            </div>
            
            <div className={styles.field}>
              <label htmlFor="companyManager">Менаџер/Одговорно лице *</label>
              <input
                type="text"
                id="companyManager"
                name="companyManager"
                value={formData.companyManager}
                onChange={handleInputChange}
                placeholder="Име и презиме"
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="officialEmail">Службена email адреса *</label>
            <input
              type="email"
              id="officialEmail"
              name="officialEmail"
              value={formData.officialEmail}
              onChange={handleInputChange}
              placeholder="company@example.com"
              required
            />
          </div>
        </div>

        <div className={styles.section}>
          <h3>Дополнителни информации (опционално)</h3>
          
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="businessActivity">Дејност на компанијата</label>
              <input
                type="text"
                id="businessActivity"
                name="businessActivity"
                value={formData.businessActivity}
                onChange={handleInputChange}
                placeholder="Опишете ја дејноста"
              />
            </div>
            
            <div className={styles.field}>
              <label htmlFor="website">Веб-страница</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="description">Опис</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Дополнителни информации за компанијата"
              rows={3}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={loading}
            className={styles.saveButton}
          >
            {loading ? 'Зачувува...' : 'Зачувај профил'}
          </button>

          <button
            type="button"
            onClick={emailSent ? handleResendEmail : handleSendVerificationEmail}
            disabled={sendingEmail || !success}
            className={styles.emailButton}
          >
            {sendingEmail 
              ? 'Испраќа...' 
              : emailSent 
                ? 'Повторно испрати email' 
                : 'Испрати верификационен email'
            }
          </button>
        </div>

        {emailSent && (
          <div className={styles.emailInfo}>
            <p>📧 Верификационен email е пратен на <strong>{formData.officialEmail}</strong></p>
            <p>Проверете го вашиот inbox (и spam папката) и кликнете на линкот за верификација.</p>
          </div>
        )}

        {showSuccessOptions && (
          <div className={styles.successActions}>
            <h3>🎉 Следни чекори</h3>
            <p>Додека чекате да ја завршите верификацијата на email-то, можете:</p>
            
            <div className={styles.actionButtons}>
              <button 
                onClick={() => navigate('/terminal')}
                className={styles.primaryAction}
              >
                🏠 Назад кон Dashboard
              </button>
              
              <button 
                onClick={() => navigate('/terminal/documents')}
                className={styles.secondaryAction}
              >
                📄 Разгледај документи (по верификација)
              </button>
            </div>
            
            <div className={styles.helpText}>
              <p>💡 <strong>Подсетник:</strong> Откако ќе ја завршите email верификацијата, ќе имате пристап до сите премиум функции!</p>
            </div>
          </div>
        )}
        </div>
      )}
          </div>
        </main>
        
        <RightSidebar />
      </div>
    </div>
  );
};

export default CompanyVerificationSingle;
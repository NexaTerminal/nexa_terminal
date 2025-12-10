import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Header from '../common/Header';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import styles from '../../styles/terminal/CompanyVerification.module.css';
import dashboardStyles from '../../styles/terminal/Dashboard.module.css';
import ApiService from '../../services/api';

// Marketplace service categories
const SERVICE_CATEGORIES = [
  { value: '', label: 'Изберете категорија на услуга', disabled: true },
  { value: 'legal', label: 'Правни услуги' },
  { value: 'accounting', label: 'Сметководство' },
  { value: 'marketing', label: 'Маркетинг' },
  { value: 'insurance', label: 'Осигурување' },
  { value: 'realestate', label: 'Агенти за недвижен имот' },
  { value: 'itsupport', label: 'ИТ поддршка' },
  { value: 'other', label: 'Друго' }
];

const CompanyVerificationSingle = () => {
  const { t } = useTranslation();
  const { currentUser: user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  // ============================================
  // EMAIL VERIFICATION DISABLED (2025-11-29)
  // ============================================
  // Email verification state variables removed - no longer needed
  // const [sendingEmail, setSendingEmail] = useState(false); // REMOVED
  // const [emailSent, setEmailSent] = useState(false); // REMOVED
  // const [showSuccessOptions, setShowSuccessOptions] = useState(false); // REMOVED
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
    // Marketplace service category selection
    serviceCategory: '',
    serviceDescription: '',
    // Optional fields - comprehensive company info
    businessActivity: '',
    website: '',
    industry: '',
    role: '',
    description: '',
    contactEmail: '',
    phone: '',
    companySize: '',
    facebook: '',
    linkedin: '',
    missionStatement: '',
    crnNumber: '',
    companyPIN: '',
    companyLogo: ''
  });

  // Check if company info is complete
  const isCompanyInfoComplete = () => {
    if (!user) return false;
    const requiredFields = [
      user.companyInfo?.companyName,
      user.companyInfo?.companyAddress || user.companyInfo?.address,
      user.companyInfo?.companyTaxNumber || user.companyInfo?.taxNumber,
      user.companyInfo?.companyManager || user.companyManager,
      user.officialEmail
    ];
    return requiredFields.every(field => field && field.trim());
  };

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
        companyManager: user.companyInfo?.companyManager || user.companyManager || '',
        officialEmail: user.officialEmail || user.email || '',
        businessActivity: user.companyInfo?.businessActivity || '',
        website: user.companyInfo?.website || '',
        industry: user.companyInfo?.industry || '',
        role: user.companyInfo?.role || '',
        description: user.companyInfo?.description || '',
        contactEmail: user.companyInfo?.contactEmail || '',
        phone: user.companyInfo?.phone || '',
        companySize: user.companyInfo?.companySize || '',
        facebook: user.companyInfo?.facebook || '',
        linkedin: user.companyInfo?.linkedin || '',
        missionStatement: user.companyInfo?.missionStatement || '',
        crnNumber: user.companyInfo?.crnNumber || '',
        companyPIN: user.companyInfo?.companyPIN || '',
        companyLogo: user.companyInfo?.companyLogo || '',
        serviceCategory: user.marketplaceInfo?.serviceCategory || '',
        serviceDescription: user.marketplaceInfo?.description || ''
      }));

      // Email verification removed - no longer checking email sent status
      // setEmailSent(user.verificationStatus === 'email_sent' || false); // REMOVED
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
            companyManager: formData.companyManager,
            businessActivity: formData.businessActivity,
            website: formData.website,
            industry: formData.industry,
            role: formData.role,
            description: formData.description,
            contactEmail: formData.contactEmail,
            phone: formData.phone,
            companySize: formData.companySize,
            facebook: formData.facebook,
            linkedin: formData.linkedin,
            missionStatement: formData.missionStatement,
            crnNumber: formData.crnNumber,
            companyPIN: formData.companyPIN,
            companyLogo: formData.companyLogo
          },
          marketplaceInfo: formData.serviceCategory ? {
            serviceCategory: formData.serviceCategory,
            description: formData.serviceDescription
          } : undefined,
          officialEmail: formData.officialEmail,
          profileComplete: true
        })
      });

      await refreshUser(); // Refresh user data after update

      // Show success message with auto-verification info
      if (response.autoVerified) {
        setSuccess('✅ Профилот е успешно ажуриран и верификуван! Сега имате пристап до сите функции.');
      } else {
        setSuccess(user?.isVerified ? 'Профилот на компанијата е успешно ажуриран!' : 'Профилот е успешно ажуриран!');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.message || 'Грешка при ажурирање на профилот.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // EMAIL VERIFICATION FUNCTIONS REMOVED (2025-11-29)
  // ============================================
  // Email verification is no longer required
  // Functions commented out for potential future use

  /* COMMENTED OUT: Email verification functions
  const handleSendVerificationEmail = async () => {
    if (!formData.officialEmail?.trim()) {
      setError('Ве молиме внесете службена email адреса.');
      return;
    }

    if (!formData.companyName?.trim() || !formData.address?.trim() || !formData.taxNumber?.trim() || !formData.companyManager?.trim()) {
      setError('Ве молиме пополнете ги сите задолжителни полиња (име на компанија, адреса, даночен број, менаџер) пред да побарате верификација.');
      return;
    }

    // Save profile first before sending email
    if (!user?.profileComplete) {
      await handleSaveProfile();
      // Wait a moment for the state to update
      await new Promise(resolve => setTimeout(resolve, 500));
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
        setShowSuccessOptions(true);
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
  */ // END OF COMMENTED OUT EMAIL FUNCTIONS

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
              <h2>{user?.isVerified && isCompanyInfoComplete() ? 'Ажурирање на профил' : 'Верификација на компанија'}</h2>
              <p>{user?.isVerified && isCompanyInfoComplete() ? 'Ажурирајте ги информациите за вашата компанија' : 'Внесете ги информациите за вашата компанија и потврдете го email-от за верификација'}</p>

        {user?.isVerified && !isCompanyInfoComplete() && (
          <div className={styles.verificationStatus}>
            <div className={styles.pendingBadge}>
              ⚠️ Профилот на компанијата е некомплетен
            </div>
            <p>Вашиот email е верификуван, но информациите за компанијата не се комплетни. Ве молиме пополнете ги сите задолжителни полиња (име на компанија, адреса, даночен број, менаџер и email).</p>
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

      {/* Comprehensive form for verified users to update company info */}
      {user?.isVerified && (
        <div className={styles.form}>
          <div className={styles.section}>
            <h3>Основни информации на компанијата</h3>
            
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
                <label htmlFor="companyManager">Управител/Одговорно лице *</label>
                <input
                  type="text"
                  id="companyManager"
                  name="companyManager"
                  value={formData.companyManager}
                  onChange={handleInputChange}
                  placeholder="Име и презиме на управителот"
                  required
                />
              </div>
            </div>

            <div className={styles.row}>
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
              
              <div className={styles.field} style={{opacity: 0.5}}>
                <label htmlFor="taxNumber">Даночен број (не може да се менува)</label>
                <input
                  type="text"
                  id="taxNumber"
                  name="taxNumber"
                  value={formData.taxNumber}
                  readOnly
                  disabled
                  className={styles.readOnlyField}
                  title="Даночниот број не може да се менува по верификацијата согласно македонското право"
                />
                <small className={styles.legalNotice}>
                  ⚖️ Даночниот број не е променлив податок
                </small>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={loading}
              className={styles.saveButton}
            >
              {loading ? 'Ажурира...' : 'Ажурирај профил'}
            </button>
          </div>
        </div>
      )}

      {!user?.isVerified && (
        <div className={styles.form}>
        <div className={styles.section}>
          <div className={styles.singleColumn}>
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
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={loading}
            className={styles.saveButton}
          >
            {loading ? 'Зачувува...' : user?.isVerified ? 'Ажурирај профил' : 'Верификувај профил'}
          </button>
        </div>

        {/* ============================================ */}
        {/* EMAIL VERIFICATION UI REMOVED (2025-11-29)   */}
        {/* ============================================ */}
        {/* Email verification button and notification UI removed */}
        {/* All features now accessible after completing company data */}

        {/* REMOVED: Second button for sending verification email
        <button
          type="button"
          onClick={emailSent ? handleResendEmail : handleSendVerificationEmail}
          disabled={sendingEmail || !success}
          className={styles.emailButton}
        >
          {sendingEmail ? 'Испраќа...' : emailSent ? 'Повторно испрати email' : 'Испрати верификационен email'}
        </button>
        */}

        {/* REMOVED: Email sent notification
        {emailSent && (
          <div className={styles.emailInfo}>
            <p>📧 Верификационен email е пратен на <strong>{formData.officialEmail}</strong></p>
            <p>Проверете го вашиот inbox (и spam папката) и кликнете на линкот за верификација.</p>
          </div>
        )}
        */}

        {/* REMOVED: Success options after email sent
        {showSuccessOptions && (
          <div className={styles.successActions}>
            <h3>🎉 Следни чекори</h3>
            <p>Додека чекате да ја завршите верификацијата на email-то, можете:</p>
            <div className={styles.actionButtons}>
              <button onClick={() => navigate('/terminal')} className={styles.primaryAction}>
                🏠 Назад кон Dashboard
              </button>
              <button onClick={() => navigate('/terminal/documents')} className={styles.secondaryAction}>
                📄 Разгледај документи (по верификација)
              </button>
            </div>
            <div className={styles.helpText}>
              <p>💡 <strong>Подсетник:</strong> Откако ќе ја завршите email верификацијата, ќе имате пристап до сите премиум функции!</p>
            </div>
          </div>
        )}
        */}
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
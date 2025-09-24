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
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showSuccessOptions, setShowSuccessOptions] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Credentials update state
  const [credentialsData, setCredentialsData] = useState({
    currentPassword: '',
    newUsername: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updatingCredentials, setUpdatingCredentials] = useState(false);
  const [credentialsError, setCredentialsError] = useState('');
  const [credentialsSuccess, setCredentialsSuccess] = useState('');

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

  const handleCredentialsChange = (e) => {
    const { name, value } = e.target;
    setCredentialsData(prev => ({ ...prev, [name]: value }));
    setCredentialsError('');
    setCredentialsSuccess('');
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

      await refreshUser(); // Refresh user data
      setSuccess(user?.isVerified ? 'Профилот на компанијата е успешно ажуриран!' : 'Профилот е успешно ажуриран!');
      
      // Only send verification email for unverified users
      if (!user?.isVerified && formData.officialEmail?.trim()) {
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

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setCredentialsError('');
    setCredentialsSuccess('');
    
    // Validation
    if (!credentialsData.currentPassword) {
      setCredentialsError('Тековната лозинка е задолжителна.');
      return;
    }
    
    if (!credentialsData.newUsername && !credentialsData.newPassword) {
      setCredentialsError('Внесете ново корисничко име или нова лозинка.');
      return;
    }
    
    if (credentialsData.newPassword !== credentialsData.confirmPassword) {
      setCredentialsError('Новата лозинка и потврдата не се совпаѓаат.');
      return;
    }
    
    if (credentialsData.newPassword && credentialsData.newPassword.length < 6) {
      setCredentialsError('Лозинката мора да има најмалку 6 карактери.');
      return;
    }
    
    setUpdatingCredentials(true);
    try {
      const updateData = {
        currentPassword: credentialsData.currentPassword
      };
      
      if (credentialsData.newUsername?.trim()) {
        updateData.username = credentialsData.newUsername.trim();
      }
      
      if (credentialsData.newPassword?.trim()) {
        updateData.password = credentialsData.newPassword.trim();
      }
      
      await ApiService.request('/users/credentials', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      setCredentialsSuccess('Корисничките податоци се успешно ажурирани!');
      setCredentialsData({
        currentPassword: '',
        newUsername: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Refresh user data
      await refreshUser();
      
      setTimeout(() => setCredentialsSuccess(''), 3000);
    } catch (error) {
      setCredentialsError(error.message || 'Настана грешка при ажурирање на корисничките податоци.');
    } finally {
      setUpdatingCredentials(false);
    }
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
              <h2>{user?.isVerified ? 'Ажурирање на профил на компанија' : 'Верификација на компанија'}</h2>
              <p>{user?.isVerified ? 'Ажурирајте ги информациите за вашата верификувана компанија' : 'Внесете ги информациите за вашата компанија и потврдете го email-от за верификација'}</p>
        
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
              
              <div className={styles.field}>
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
                  ⚖️ Даночниот број не може да се менува согласно Законот за трговски друштва
                </small>
              </div>
            </div>

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
                <label htmlFor="industry">Индустрија</label>
                <input
                  type="text"
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  placeholder="Индустријски сектор"
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="companySize">Големина на компанија</label>
                <select
                  id="companySize"
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleInputChange}
                >
                  <option value="">Изберете големина</option>
                  <option value="1-10">1-10 вработени</option>
                  <option value="11-50">11-50 вработени</option>
                  <option value="51-200">51-200 вработени</option>
                  <option value="201-1000">201-1000 вработени</option>
                  <option value="1000+">Повеќе од 1000 вработени</option>
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="crnNumber">ЕДБ број</label>
                <input
                  type="text"
                  id="crnNumber"
                  name="crnNumber"
                  value={formData.crnNumber}
                  onChange={handleInputChange}
                  placeholder="Единствен број во Централниот регистар"
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Контакт информации</h3>
            
            <div className={styles.row}>
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
              
              <div className={styles.field}>
                <label htmlFor="contactEmail">Контакт email (дополнителна)</label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  placeholder="info@example.com"
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="phone">Телефон</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+389 XX XXX XXX"
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
          </div>

          <div className={styles.section}>
            <h3>🏪 Marketplace услуги</h3>
            <p className={styles.sectionDescription}>
              Управувајте со вашето присуство во Nexa Marketplace
            </p>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="serviceCategory">Категорија на услуга</label>
                <select
                  id="serviceCategory"
                  name="serviceCategory"
                  value={formData.serviceCategory}
                  onChange={handleInputChange}
                >
                  {SERVICE_CATEGORIES.map(category => (
                    <option
                      key={category.value}
                      value={category.value}
                      disabled={category.disabled}
                    >
                      {category.label}
                    </option>
                  ))}
                </select>
                <small className={styles.fieldHint}>
                  Изберете ја категоријата која најдобро ја опишува вашата услуга
                </small>
              </div>
            </div>

            {formData.serviceCategory && (
              <div className={styles.field}>
                <label htmlFor="serviceDescription">Опис на услугата</label>
                <textarea
                  id="serviceDescription"
                  name="serviceDescription"
                  value={formData.serviceDescription}
                  onChange={handleInputChange}
                  placeholder="Опишете ги услугите што ги нудите..."
                  rows={3}
                />
                <small className={styles.fieldHint}>
                  Овој опис ќе биде видлив на другите корисници во Marketplace
                </small>
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h3>Опис и мисија</h3>
            
            <div className={styles.field}>
              <label htmlFor="description">Опис на компанијата</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Краток опис на дејностите и активностите на компанијата"
                rows={4}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="missionStatement">Мисија на компанијата</label>
              <textarea
                id="missionStatement"
                name="missionStatement"
                value={formData.missionStatement}
                onChange={handleInputChange}
                placeholder="Мисијата и визијата на компанијата"
                rows={3}
              />
            </div>
          </div>

          <div className={styles.section}>
            <h3>Социјални мрежи</h3>
            
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="facebook">Facebook профил</label>
                <input
                  type="url"
                  id="facebook"
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleInputChange}
                  placeholder="https://facebook.com/company"
                />
              </div>
              
              <div className={styles.field}>
                <label htmlFor="linkedin">LinkedIn профил</label>
                <input
                  type="url"
                  id="linkedin"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/company/company"
                />
              </div>
            </div>
          </div>

          {/* Credentials Update Section */}
          <div className={styles.section}>
            <h3>🔐 Промена на корисничко име и лозинка</h3>
            <p className={styles.sectionDescription}>
              Ажурирајте ги вашите кориснички права за пријавување
            </p>

            {credentialsError && (
              <div className={styles.errorMessage}>
                <span className={styles.errorIcon}>❌</span>
                {credentialsError}
              </div>
            )}

            {credentialsSuccess && (
              <div className={styles.successMessage}>
                <span className={styles.successIcon}>✅</span>
                {credentialsSuccess}
              </div>
            )}

            <div className={styles.credentialsForm}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="currentPassword">Моментална лозинка *</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={credentialsData.currentPassword}
                    onChange={handleCredentialsChange}
                    placeholder="Внесете ја моменталната лозинка"
                    required
                  />
                  <small className={styles.fieldHint}>
                    Потребно е за потврда на идентитетот
                  </small>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="newUsername">Ново корисничко име</label>
                  <input
                    type="text"
                    id="newUsername"
                    name="newUsername"
                    value={credentialsData.newUsername}
                    onChange={handleCredentialsChange}
                    placeholder="Оставете празно за да не се менува"
                  />
                  <small className={styles.fieldHint}>
                    Тековно корисничко име: <strong>{user?.username}</strong>
                  </small>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="newPassword">Нова лозинка</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={credentialsData.newPassword}
                    onChange={handleCredentialsChange}
                    placeholder="Оставете празно за да не се менува"
                  />
                  <small className={styles.fieldHint}>
                    Минимум 6 карактери
                  </small>
                </div>
                
                <div className={styles.field}>
                  <label htmlFor="confirmPassword">Потврдете ја новата лозинка</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={credentialsData.confirmPassword}
                    onChange={handleCredentialsChange}
                    placeholder="Повторете ја новата лозинка"
                  />
                  <small className={styles.fieldHint}>
                    Лозинките мора да се совпаѓаат
                  </small>
                </div>
              </div>

              <div className={styles.credentialsActions}>
                <button
                  type="button"
                  onClick={handleCredentialsSubmit}
                  disabled={updatingCredentials}
                  className={styles.credentialsButton}
                >
                  {updatingCredentials ? 'Ажурира...' : '🔐 Ажурирај корисни податоци'}
                </button>
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
          <h3>🏪 Marketplace услуги (опционално)</h3>
          <p className={styles.sectionDescription}>
            Изберете категорија на услуга која ја нудите за да бидете вклучени во Nexa Marketplace
          </p>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="serviceCategory">Категорија на услуга</label>
              <select
                id="serviceCategory"
                name="serviceCategory"
                value={formData.serviceCategory}
                onChange={handleInputChange}
              >
                {SERVICE_CATEGORIES.map(category => (
                  <option
                    key={category.value}
                    value={category.value}
                    disabled={category.disabled}
                  >
                    {category.label}
                  </option>
                ))}
              </select>
              <small className={styles.fieldHint}>
                Изберете ја категоријата која најдобро ја опишува вашата услуга
              </small>
            </div>
          </div>

          {formData.serviceCategory && (
            <div className={styles.field}>
              <label htmlFor="serviceDescription">Опис на услугата</label>
              <textarea
                id="serviceDescription"
                name="serviceDescription"
                value={formData.serviceDescription}
                onChange={handleInputChange}
                placeholder="Опишете ги услугите што ги нудите..."
                rows={3}
              />
              <small className={styles.fieldHint}>
                Овој опис ќе биде видлив на другите корисници во Marketplace
              </small>
            </div>
          )}
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
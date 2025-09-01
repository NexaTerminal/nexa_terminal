import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';
import Header from '../common/Header';
import Footer from '../common/Footer';
import Sidebar from './Sidebar';
import ProfileRequired from '../common/ProfileRequired';
import styles from '../../styles/terminal/CompanyVerification.module.css';

const CompanyVerification = () => {
  const { currentUser, updateProfile, setCurrentUser } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    companyName: '',
    mission: '',
    website: '',
    industry: '',
    companySize: '',
    role: '',
    address: '',
    phone: '',
    taxNumber: '',
    companyManager: '',
    officialEmail: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const industryOptions = [
    'Технологии', 'Финансииiii', 'Здравство', 'Образование', 'Трговија',
    'Производство', 'Услуги', 'Градежништво', 'Транспорт', 'Туризм',
    'Земјоделство', 'Енергетика', 'Друго'
  ];
  const companySizeOptions = [
    '1-10 вработени', '11-50 вработени', '51-200 вработени', '201-500 вработени', '500+ вработени'
  ];

  useEffect(() => {
    if (currentUser) {
      setFormData({
        email: currentUser.email || currentUser.username || '',
        companyName: currentUser.companyInfo?.companyName || '',
        mission: currentUser.companyInfo?.mission || '',
        website: currentUser.companyInfo?.website || '',
        industry: currentUser.companyInfo?.industry || '',
        companySize: currentUser.companyInfo?.companySize || '',
        role: currentUser.companyInfo?.role || '',
        address: currentUser.companyInfo?.address || '',
        phone: currentUser.companyInfo?.phone || '',
        taxNumber: currentUser.companyInfo?.taxNumber || '',
        companyManager: currentUser.companyManager || '',
        officialEmail: currentUser.officialEmail || ''
      });
      setLoading(false);
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    
    try {
      const updateData = {
        email: formData.email,
        companyInfo: {
          companyName: formData.companyName,
          mission: formData.mission,
          website: formData.website,
          industry: formData.industry,
          companySize: formData.companySize,
          role: formData.role,
          address: formData.address,
          phone: formData.phone,
          taxNumber: formData.taxNumber
        },
        companyManager: formData.companyManager,
        officialEmail: formData.officialEmail,
        profileComplete: true
      };
      
      await ApiService.request('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      setSuccess('Профилот е успешно ажуриран!');
      
      // Update the user context with new data
      const updatedUserResponse = await ApiService.request('/users/profile');
      if (updatedUserResponse.user) {
        setCurrentUser(updatedUserResponse.user);
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Настана грешка при зачувување на профилот.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    if (!formData.officialEmail || !formData.companyName || !formData.companyManager) {
      setError('Потребни се службена email адреса, име на компанија и менаџер за да се испрати верификација.');
      return;
    }

    setError('');
    setSuccess('');
    setSendingEmail(true);

    try {
      await ApiService.request('/verification/send-verification-email', {
        method: 'POST',
        body: JSON.stringify({
          officialEmail: formData.officialEmail,
          companyName: formData.companyName,
          companyManager: formData.companyManager
        })
      });

      setEmailSent(true);
      setSuccess(`Верификацискиот email е испратен на ${formData.officialEmail}. Проверете го вашето сандаче и кликнете на врската за да ја потврдите email адресата.`);
    } catch (error) {
      setError(error.message || 'Настана грешка при испраќање на верификацискиот email.');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return <div className={styles.container}>Се вчитуваат податоци...</div>;
  }

  return (
    <ProfileRequired>
      <div>
        <Header isTerminal={true} />
        <div className={styles['dashboard-layout']}>
          <Sidebar />
          <main className={styles['dashboard-main']}>
            <div className={styles.container}>
              <div className={styles.pageHeader}>
                <h1>Профил</h1>
                <p>Управувајте со информациите за вашата компанија</p>
              </div>
              {error && <div className={styles.error}>{error}</div>}
              {success && <div className={styles.success}>{success}</div>}
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.section}>
                  <h3>Лични податоци</h3>
                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email адреса {!currentUser?.email && '*'}</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      required={!currentUser?.email}
                    />
                  </div>
                </div>
                <div className={styles.section}>
                  <h3>Компаниски податоци</h3>
                  <div className={styles.formGroup}>
                    <label htmlFor="companyName">Име на компанија *</label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="Внесете го името на вашата компанија"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="address">Адреса *</label>
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
                  <div className={styles.formGroup}>
                    <label htmlFor="role">Ваша позиција</label>
                    <input
                      type="text"
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      placeholder="Извршен директор, Основач, Менаџер..."
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="mission">Мисија на компанијата</label>
                    <textarea
                      id="mission"
                      name="mission"
                      value={formData.mission}
                      onChange={handleInputChange}
                      placeholder="Опишете ја мисијата и целите на вашата компанија..."
                      rows={3}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="industry">Индустрија</label>
                    <select
                      id="industry"
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                    >
                      <option value="">Изберете индустрија</option>
                      {industryOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="companySize">Големина на компанија</label>
                    <select
                      id="companySize"
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleInputChange}
                    >
                      <option value="">Изберете големина</option>
                      {companySizeOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="website">Веб-страница</label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://www.example.com"
                    />
                  </div>
                </div>
                <div className={styles.section}>
                  <h3>Правни и контакт податоци</h3>
                  <div className={styles.formGroup}>
                    <label htmlFor="taxNumber">Даночен број *</label>
                    <input
                      type="text"
                      id="taxNumber"
                      name="taxNumber"
                      value={formData.taxNumber}
                      onChange={handleInputChange}
                      placeholder="4080012345678"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="companyManager">Менаџер/Одговорно лице *</label>
                    <input
                      type="text"
                      id="companyManager"
                      name="companyManager"
                      value={formData.companyManager}
                      onChange={handleInputChange}
                      placeholder="Марко Петровски"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="officialEmail">Службена email адреса на компанијата *</label>
                    <input
                      type="email"
                      id="officialEmail"
                      name="officialEmail"
                      value={formData.officialEmail}
                      onChange={handleInputChange}
                      placeholder="info@vashakompanija.mk"
                      required
                    />
                    <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                      Ова е службената email адреса што ќе се користи за верификација на компанијата
                    </small>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="phone">Телефон</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+389 2 123 456"
                    />
                  </div>
                </div>
                
                {/* Verification Status Section */}
                {formData.officialEmail && formData.companyName && formData.companyManager && (
                  <div className={styles.section}>
                    <h3>Email Верификација</h3>
                    <div className={styles.verificationSection}>
                      {currentUser?.emailVerified ? (
                        <div className={styles.verifiedStatus}>
                          <span className={styles.verifiedIcon}>✅</span>
                          <span>Email адресата е верификувана</span>
                          {currentUser?.isVerified ? (
                            <div className={styles.statusMessage}>
                              <span className={styles.approvedIcon}>🎉</span>
                              Компанијата е одобрена и може да користи сите функции!
                            </div>
                          ) : (
                            <div className={styles.statusMessage}>
                              ⏳ Профилот чека одобрување од администратор
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={styles.unverifiedStatus}>
                          <span className={styles.unverifiedIcon}>📧</span>
                          <span>Email адресата не е верификувана</span>
                          <button
                            type="button"
                            onClick={handleSendVerificationEmail}
                            className={styles.verifyBtn}
                            disabled={sendingEmail || emailSent}
                          >
                            {sendingEmail ? 'Се испраќа...' : emailSent ? 'Email испратен ✓' : 'Испрати верификација'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className={styles.submitSection}>
                  <button type="submit" className={styles.submitBtn} disabled={saving}>
                    {saving ? 'Се зачувува...' : 'Зачувај промени'}
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </ProfileRequired>
  );
};

export default CompanyVerification;

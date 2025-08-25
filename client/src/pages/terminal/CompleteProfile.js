import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import styles from '../../styles/terminal/CompleteProfile.module.css';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';

const CompleteProfile = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    companyName: '',
    industry: '',
    companySize: '',
    role: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { currentUser, updateProfile } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Validate required fields
      if (!formData.email.trim()) {
        throw new Error(t('profile.emailRequired', 'Email is required'));
      }
      if (!formData.companyName.trim()) {
        throw new Error(t('profile.companyNameRequired', 'Company name is required'));
      }
      if (!formData.industry) {
        throw new Error(t('profile.industryRequired', 'Please select an industry'));
      }

      // Submit profile data (simplified without fullName)
      await updateProfile({
        email: formData.email.trim(),
        companyInfo: {
          companyName: formData.companyName.trim(),
          industry: formData.industry,
          companySize: formData.companySize,
          role: formData.role
        },
        profileComplete: true
      });

      // Navigate to terminal/dashboard
      navigate('/terminal', { replace: true });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Navigate to terminal even if profile is incomplete
    navigate('/terminal', { replace: true });
  };

  return (
    <div className={styles.completeProfileContainer}>
      <Header isTerminal={true} />
      <div className={styles.contentWrapper}>
        <Sidebar />
        <main className={styles.mainContent}>
          <div className={styles.formWrapper}>
            <div className={styles.header}>
              <h1 className={styles.title}>
                {t('profile.completeTitle', 'Complete Your Profile')}
              </h1>
              <p className={styles.subtitle}>
                {t('profile.completeSubtitle', 'Help us personalize your Nexa experience by telling us about yourself and your business.')}
              </p>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <form className={styles.profileForm} onSubmit={handleSubmit}>
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  {t('profile.personalInfo', 'Personal Information')}
                </h2>
                
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.formLabel}>
                    {t('profile.email', 'Email Address')} *
                  </label>
                  <input
                    type="email"
                    id="email"
                    className={styles.formInput}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder={t('profile.emailPlaceholder', 'Enter your email address')}
                    required
                  />
                </div>
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  {t('profile.businessInfo', 'Business Information')}
                </h2>
                
                <div className={styles.formGroup}>
                  <label htmlFor="companyName" className={styles.formLabel}>
                    {t('profile.companyName', 'Company Name')} *
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    className={styles.formInput}
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder={t('profile.companyNamePlaceholder', 'Enter your company name')}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="industry" className={styles.formLabel}>
                    {t('profile.industry', 'Industry')} *
                  </label>
                  <select
                    id="industry"
                    className={styles.formInput}
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    required
                  >
                    <option value="">{t('profile.selectIndustry', 'Select your industry')}</option>
                    <option value="technology">{t('profile.industries.technology', 'Technology')}</option>
                    <option value="finance">{t('profile.industries.finance', 'Finance')}</option>
                    <option value="healthcare">{t('profile.industries.healthcare', 'Healthcare')}</option>
                    <option value="education">{t('profile.industries.education', 'Education')}</option>
                    <option value="retail">{t('profile.industries.retail', 'Retail')}</option>
                    <option value="manufacturing">{t('profile.industries.manufacturing', 'Manufacturing')}</option>
                    <option value="consulting">{t('profile.industries.consulting', 'Consulting')}</option>
                    <option value="real-estate">{t('profile.industries.realEstate', 'Real Estate')}</option>
                    <option value="food-beverage">{t('profile.industries.foodBeverage', 'Food & Beverage')}</option>
                    <option value="other">{t('profile.industries.other', 'Other')}</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="companySize" className={styles.formLabel}>
                    {t('profile.companySize', 'Company Size')}
                  </label>
                  <select
                    id="companySize"
                    className={styles.formInput}
                    value={formData.companySize}
                    onChange={(e) => handleInputChange('companySize', e.target.value)}
                  >
                    <option value="">{t('profile.selectCompanySize', 'Select company size (optional)')}</option>
                    <option value="1">{t('profile.companySizes.solo', 'Just me')}</option>
                    <option value="2-10">{t('profile.companySizes.small', '2-10 employees')}</option>
                    <option value="11-50">{t('profile.companySizes.medium', '11-50 employees')}</option>
                    <option value="51-200">{t('profile.companySizes.large', '51-200 employees')}</option>
                    <option value="200+">{t('profile.companySizes.enterprise', '200+ employees')}</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="role" className={styles.formLabel}>
                    {t('profile.role', 'Your Role')}
                  </label>
                  <input
                    type="text"
                    id="role"
                    className={styles.formInput}
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    placeholder={t('profile.rolePlaceholder', 'e.g., Founder, Manager, Consultant (optional)')}
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button 
                  type="button" 
                  onClick={handleSkip}
                  className={styles.skipButton}
                  disabled={loading}
                >
                  {t('profile.skipForNow', 'Skip for now')}
                </button>
                
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading 
                    ? t('profile.saving', 'Saving...') 
                    : t('profile.completeProfile', 'Complete Profile')
                  }
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CompleteProfile;

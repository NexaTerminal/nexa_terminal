import React, { useState, useEffect } from 'react';
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
    role: '',
    // Marketplace service category (optional)
    serviceCategory: '',
    serviceDescription: '',
    servesRemote: false
  });
  const [serviceCategories, setServiceCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { currentUser, updateProfile, token } = useAuth();
  const navigate = useNavigate();

  // Load service categories
  useEffect(() => {
    const loadServiceCategories = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/marketplace/categories`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            credentials: 'include'
          }
        );

        if (response.ok) {
          const result = await response.json();
          setServiceCategories(result.data || []);
        }
      } catch (error) {
        console.error('Error loading service categories:', error);
        // Set fallback categories if API fails
        setServiceCategories([
          { value: 'legal', label: 'Legal Services', icon: '⚖️' },
          { value: 'accounting', label: 'Accounting & Finance', icon: '💰' },
          { value: 'marketing', label: 'Marketing & Advertising', icon: '📈' },
          { value: 'it', label: 'IT & Technology', icon: '💻' },
          { value: 'consulting', label: 'Business Consulting', icon: '📊' },
          { value: 'realestate', label: 'Real Estate', icon: '🏢' },
          { value: 'cybersecurity', label: 'Cybersecurity', icon: '🔒' }
        ]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadServiceCategories();
  }, [token]);

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

      // Submit profile data with optional service category
      const profileData = {
        email: formData.email.trim(),
        companyInfo: {
          companyName: formData.companyName.trim(),
          industry: formData.industry,
          companySize: formData.companySize,
          role: formData.role
        },
        profileComplete: true
      };

      // Add marketplace info if service category is selected
      if (formData.serviceCategory) {
        profileData.marketplaceInfo = {
          serviceCategory: formData.serviceCategory,
          serviceDescription: formData.serviceDescription?.trim() || '',
          servesRemote: formData.servesRemote
        };
      }

      await updateProfile(profileData);

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
      <Header isTerminal={false} />
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

              {/* Optional Marketplace Section */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  {t('profile.marketplaceInfo', 'Service Provider Information')}
                  <span className={styles.optional}>{t('profile.optional', '(Optional)')}</span>
                </h2>
                <p className={styles.sectionDescription}>
                  {t('profile.marketplaceDescription', 'Want to offer services to other businesses? Select your primary service category to join our marketplace.')}
                </p>

                <div className={styles.formGroup}>
                  <label htmlFor="serviceCategory" className={styles.formLabel}>
                    {t('profile.serviceCategory', 'Primary Service Category')}
                  </label>
                  {isLoadingCategories ? (
                    <div className={styles.loadingText}>Loading categories...</div>
                  ) : (
                    <select
                      id="serviceCategory"
                      className={styles.formInput}
                      value={formData.serviceCategory}
                      onChange={(e) => handleInputChange('serviceCategory', e.target.value)}
                    >
                      <option value="">{t('profile.selectServiceCategory', 'Select a service category (optional)')}</option>
                      {serviceCategories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.icon} {category.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {formData.serviceCategory && (
                  <>
                    <div className={styles.formGroup}>
                      <label htmlFor="serviceDescription" className={styles.formLabel}>
                        {t('profile.serviceDescription', 'Service Description')}
                      </label>
                      <textarea
                        id="serviceDescription"
                        className={styles.formTextarea}
                        value={formData.serviceDescription}
                        onChange={(e) => handleInputChange('serviceDescription', e.target.value)}
                        placeholder={t('profile.serviceDescriptionPlaceholder', 'Briefly describe the services you offer...')}
                        rows={3}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.servesRemote}
                          onChange={(e) => handleInputChange('servesRemote', e.target.checked)}
                          className={styles.checkbox}
                        />
                        {t('profile.servesRemote', 'I can provide services remotely')}
                      </label>
                    </div>
                  </>
                )}
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
    </div>
  );
};

export default CompleteProfile;

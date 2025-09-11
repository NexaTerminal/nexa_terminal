import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ApiService from '../../services/api';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import RightSidebar from '../../components/terminal/RightSidebar';
import styles from '../../styles/terminal/User.module.css';

const User = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [credentialsData, setCredentialsData] = useState({
    currentPassword: '',
    newUsername: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updatingCredentials, setUpdatingCredentials] = useState(false);
  const [credentialsError, setCredentialsError] = useState('');
  const [credentialsSuccess, setCredentialsSuccess] = useState('');

  // Company profile state
  const [companyData, setCompanyData] = useState({
    companyName: '',
    companyAddress: '',
    companyTaxNumber: '',
    companyManager: '',
    companyLogo: '',
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
    companyPIN: ''
  });
  const [updatingCompany, setUpdatingCompany] = useState(false);
  const [companyError, setCompanyError] = useState('');
  const [companySuccess, setCompanySuccess] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  // Load user data on component mount
  useEffect(() => {
    if (currentUser?.companyInfo) {
      setCompanyData({
        companyName: currentUser.companyInfo.companyName || '',
        companyAddress: currentUser.companyInfo.companyAddress || '',
        companyTaxNumber: currentUser.companyInfo.companyTaxNumber || '',
        companyManager: currentUser.companyInfo.companyManager || '',
        companyLogo: currentUser.companyInfo.companyLogo || '',
        businessActivity: currentUser.companyInfo.businessActivity || '',
        website: currentUser.companyInfo.website || '',
        industry: currentUser.companyInfo.industry || '',
        role: currentUser.companyInfo.role || '',
        description: currentUser.companyInfo.description || '',
        contactEmail: currentUser.companyInfo.contactEmail || '',
        phone: currentUser.companyInfo.phone || '',
        companySize: currentUser.companyInfo.companySize || '',
        facebook: currentUser.companyInfo.facebook || '',
        linkedin: currentUser.companyInfo.linkedin || '',
        missionStatement: currentUser.companyInfo.missionStatement || '',
        crnNumber: currentUser.companyInfo.crnNumber || '',
        companyPIN: currentUser.companyInfo.companyPIN || ''
      });
      setLogoPreview(currentUser.companyInfo.companyLogo || '');
    }
  }, [currentUser]);

  const handleCredentialsChange = (e) => {
    const { name, value } = e.target;
    setCredentialsData(prev => ({ ...prev, [name]: value }));
  };

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setCompanyError('Ве молиме изберете валидна слика (JPG, PNG, GIF).');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setCompanyError('Сликата не може да биде поголема од 5MB.');
        return;
      }
      
      setLogoFile(file);
      setCompanyError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setCompanyError('');
    setCompanySuccess('');
    
    // Validation
    if (!companyData.companyName.trim()) {
      setCompanyError('Името на компанијата е задолжително.');
      return;
    }
    
    setUpdatingCompany(true);
    try {
      let logoUrl = companyData.companyLogo;
      
      // TODO: Implement logo upload to cloud storage
      // For now, we'll use a placeholder or existing URL
      if (logoFile) {
        // In a real implementation, you would upload to cloud storage here
        // logoUrl = await uploadLogo(logoFile);
        console.log('Logo file selected:', logoFile.name);
      }
      
      const updateData = {
        companyInfo: {
          ...companyData,
          companyLogo: logoUrl
        }
      };
      
      const response = await ApiService.request('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      setCompanySuccess('Профилот на компанијата е успешно ажуриран!');
      
      // Update the user context with new data
      const updatedUserResponse = await ApiService.request('/users/profile');
      if (updatedUserResponse.user) {
        setCurrentUser(updatedUserResponse.user);
      }
      
      setTimeout(() => setCompanySuccess(''), 3000);
    } catch (error) {
      setCompanyError(error.message || 'Настана грешка при ажурирање на профилот на компанијата.');
    } finally {
      setUpdatingCompany(false);
    }
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setCredentialsError('');
    setCredentialsSuccess('');
    
    // Validation
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
      
      if (credentialsData.newUsername) {
        updateData.username = credentialsData.newUsername;
      }
      
      if (credentialsData.newPassword) {
        updateData.password = credentialsData.newPassword;
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
      
      // Update the user context with new data
      const updatedUserResponse = await ApiService.request('/users/profile');
      if (updatedUserResponse.user) {
        setCurrentUser(updatedUserResponse.user);
      }
      
      setTimeout(() => setCredentialsSuccess(''), 3000);
    } catch (error) {
      setCredentialsError(error.message || 'Настана грешка при ажурирање на корисничките податоци.');
    } finally {
      setUpdatingCredentials(false);
    }
  };

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  return (
    <div className={styles['dashboard-layout']}>
      <Header isTerminal={true} />
      <Sidebar />
      <main className={styles['dashboard-main']}>
        <div className={styles.container}>
          <div className={styles.pageHeader}>
            <h1>Корисник</h1>
            <p>Управувајте со вашите кориснички податоци</p>
          </div>

          {credentialsError && <div className={styles.error}>{credentialsError}</div>}
          {credentialsSuccess && <div className={styles.success}>{credentialsSuccess}</div>}
          {companyError && <div className={styles.error}>{companyError}</div>}
          {companySuccess && <div className={styles.success}>{companySuccess}</div>}

          <div className={styles.centeredForm}>
            <div className={styles.credentialsSection}>
              <h3>Ажурирај кориснички податоци</h3>
              <p>Променете го вашето корисничко име и лозинка</p>
              
              <form onSubmit={handleCredentialsSubmit} className={styles.credentialsForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="currentPassword">Тековна лозинка *</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={credentialsData.currentPassword}
                    onChange={handleCredentialsChange}
                    placeholder="Внесете ја вашата тековна лозинка"
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="newUsername">Ново корисничко име</label>
                  <input
                    type="text"
                    id="newUsername"
                    name="newUsername"
                    value={credentialsData.newUsername}
                    onChange={handleCredentialsChange}
                    placeholder="Внесете ново корисничко име"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="newPassword">Нова лозинка</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={credentialsData.newPassword}
                    onChange={handleCredentialsChange}
                    placeholder="Внесете нова лозинка (мин. 6 карактери)"
                    minLength={6}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword">Потврди нова лозинка</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={credentialsData.confirmPassword}
                    onChange={handleCredentialsChange}
                    placeholder="Повторно внесете ја новата лозинка"
                  />
                </div>
                
                <div className={styles.submitSection}>
                  <button type="submit" className={styles.submitBtn} disabled={updatingCredentials}>
                    {updatingCredentials ? 'Се ажурира...' : 'Ажурирај кориснички податоци'}
                  </button>
                </div>
              </form>
            </div>

            <div className={styles.companySection}>
              <h3>Профил на компанија</h3>
              <p>Ажурирајте ги информациите за вашата компанија</p>
              
              <form onSubmit={handleCompanySubmit} className={styles.companyForm}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="companyName">Име на компанија *</label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={companyData.companyName}
                      onChange={handleCompanyChange}
                      placeholder="Внесете име на компанија"
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="companyManager">Управител</label>
                    <input
                      type="text"
                      id="companyManager"
                      name="companyManager"
                      value={companyData.companyManager}
                      onChange={handleCompanyChange}
                      placeholder="Внесете име на управител"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="companyAddress">Адреса на компанија</label>
                    <input
                      type="text"
                      id="companyAddress"
                      name="companyAddress"
                      value={companyData.companyAddress}
                      onChange={handleCompanyChange}
                      placeholder="Внесете адреса на компанија"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="companyTaxNumber">Даночен број</label>
                    <input
                      type="text"
                      id="companyTaxNumber"
                      name="companyTaxNumber"
                      value={companyData.companyTaxNumber}
                      onChange={handleCompanyChange}
                      placeholder="Внесете даночен број"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="businessActivity">Дејност</label>
                    <input
                      type="text"
                      id="businessActivity"
                      name="businessActivity"
                      value={companyData.businessActivity}
                      onChange={handleCompanyChange}
                      placeholder="Внесете дејност на компанија"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="industry">Индустрија</label>
                    <input
                      type="text"
                      id="industry"
                      name="industry"
                      value={companyData.industry}
                      onChange={handleCompanyChange}
                      placeholder="Внесете индустрија"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="website">Веб страна</label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={companyData.website}
                      onChange={handleCompanyChange}
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="contactEmail">Контакт емаил</label>
                    <input
                      type="email"
                      id="contactEmail"
                      name="contactEmail"
                      value={companyData.contactEmail}
                      onChange={handleCompanyChange}
                      placeholder="contact@company.com"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="phone">Телефон</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={companyData.phone}
                      onChange={handleCompanyChange}
                      placeholder="+389 XX XXX XXX"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="companySize">Големина на компанија</label>
                    <select
                      id="companySize"
                      name="companySize"
                      value={companyData.companySize}
                      onChange={handleCompanyChange}
                    >
                      <option value="">Изберете големина</option>
                      <option value="1-10">1-10 вработени</option>
                      <option value="11-50">11-50 вработени</option>
                      <option value="51-200">51-200 вработени</option>
                      <option value="201-1000">201-1000 вработени</option>
                      <option value="1000+">Повеќе од 1000 вработени</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="description">Опис на компанија</label>
                  <textarea
                    id="description"
                    name="description"
                    value={companyData.description}
                    onChange={handleCompanyChange}
                    placeholder="Внесете краток опис на компанијата"
                    rows="4"
                  />
                </div>

                <div className={styles.logoSection}>
                  <label>Лого на компанија</label>
                  <div className={styles.logoUpload}>
                    {logoPreview && (
                      <div className={styles.logoPreview}>
                        <img src={logoPreview} alt="Company Logo" />
                      </div>
                    )}
                    <input
                      type="file"
                      id="companyLogo"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className={styles.logoInput}
                    />
                    <label htmlFor="companyLogo" className={styles.logoLabel}>
                      {logoFile ? logoFile.name : 'Изберете слика за лого'}
                    </label>
                  </div>
                </div>

                <div className={styles.socialSection}>
                  <h4>Социјални мрежи</h4>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="facebook">Facebook</label>
                      <input
                        type="url"
                        id="facebook"
                        name="facebook"
                        value={companyData.facebook}
                        onChange={handleCompanyChange}
                        placeholder="https://facebook.com/company"
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label htmlFor="linkedin">LinkedIn</label>
                      <input
                        type="url"
                        id="linkedin"
                        name="linkedin"
                        value={companyData.linkedin}
                        onChange={handleCompanyChange}
                        placeholder="https://linkedin.com/company/company"
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.submitSection}>
                  <button type="submit" className={styles.submitBtn} disabled={updatingCompany}>
                    {updatingCompany ? 'Се ажурира...' : 'Ажурирај профил на компанија'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <RightSidebar />
    </div>
  );
};

export default User; 
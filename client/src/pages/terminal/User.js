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

  const handleCredentialsChange = (e) => {
    const { name, value } = e.target;
    setCredentialsData(prev => ({ ...prev, [name]: value }));
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
          </div>
        </div>
      </main>
      <RightSidebar />
    </div>
  );
};

export default User; 
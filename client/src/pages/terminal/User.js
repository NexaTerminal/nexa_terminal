import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

  // Username form
  const [usernameData, setUsernameData] = useState({
    currentPassword: '',
    newUsername: ''
  });
  const [updatingUsername, setUpdatingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleUsernameChange = (e) => {
    const { name, value } = e.target;
    setUsernameData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const refreshCurrentUser = async () => {
    const updatedUserResponse = await ApiService.request('/users/profile');
    if (updatedUserResponse.user) {
      setCurrentUser(updatedUserResponse.user);
    }
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setUsernameError('');
    setUsernameSuccess('');

    if (!usernameData.newUsername.trim()) {
      setUsernameError('Внесете ново корисничко име.');
      return;
    }

    setUpdatingUsername(true);
    try {
      await ApiService.request('/users/credentials', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: usernameData.currentPassword,
          username: usernameData.newUsername.trim()
        }),
      });

      setUsernameSuccess('Корисничкото име е успешно ажурирано!');
      setUsernameData({ currentPassword: '', newUsername: '' });
      await refreshCurrentUser();
      setTimeout(() => setUsernameSuccess(''), 3000);
    } catch (error) {
      setUsernameError(error.message || 'Настана грешка при ажурирање на корисничкото име.');
    } finally {
      setUpdatingUsername(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Новата лозинка и потврдата не се совпаѓаат.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Лозинката мора да има најмалку 6 карактери.');
      return;
    }

    setUpdatingPassword(true);
    try {
      await ApiService.request('/users/credentials', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          password: passwordData.newPassword
        }),
      });

      setPasswordSuccess('Лозинката е успешно ажурирана!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      await refreshCurrentUser();
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (error) {
      setPasswordError(error.message || 'Настана грешка при ажурирање на лозинката.');
    } finally {
      setUpdatingPassword(false);
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

          {/* Redirect notice for company info */}
          <div className={styles.redirectNotice}>
            <div className={styles.infoIcon}>ℹ️</div>
            <div className={styles.redirectContent}>
              <h4>Профил на компанија</h4>
              <p>За да ажурирате ги информациите за компанијата, посетете ја страницата за</p>
              <Link to="/terminal/verification" className={styles.redirectLink}>
                Верификација на компанија →
              </Link>
            </div>
          </div>

          <div className={styles.centeredForm}>
            {/* Change username */}
            <div className={styles.credentialsSection}>
              <h3>Промени корисничко име</h3>
              <p>Внесете ја тековната лозинка за да го потврдите новото корисничко име.</p>

              {usernameError && <div className={styles.error}>{usernameError}</div>}
              {usernameSuccess && <div className={styles.success}>{usernameSuccess}</div>}

              <form onSubmit={handleUsernameSubmit} className={styles.credentialsForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="usernameCurrentPassword">Тековна лозинка *</label>
                  <input
                    type="password"
                    id="usernameCurrentPassword"
                    name="currentPassword"
                    value={usernameData.currentPassword}
                    onChange={handleUsernameChange}
                    placeholder="За да потврдите промени, внесете ја тековната лозинка"
                    autoComplete="current-password"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="newUsername">Ново корисничко име *</label>
                  <input
                    type="text"
                    id="newUsername"
                    name="newUsername"
                    value={usernameData.newUsername}
                    onChange={handleUsernameChange}
                    placeholder="Внесете го новото корисничко име"
                    autoComplete="username"
                    required
                  />
                </div>

                <div className={styles.submitSection}>
                  <button type="submit" className={styles.submitBtn} disabled={updatingUsername}>
                    {updatingUsername ? 'Се ажурира...' : 'Зачувај корисничко име'}
                  </button>
                </div>
              </form>
            </div>

            {/* Change password */}
            <div className={styles.credentialsSection}>
              <h3>Промени лозинка</h3>
              <p>Внесете ја тековната лозинка, па внесете и потврдете ја новата лозинка.</p>

              {passwordError && <div className={styles.error}>{passwordError}</div>}
              {passwordSuccess && <div className={styles.success}>{passwordSuccess}</div>}

              <form onSubmit={handlePasswordSubmit} className={styles.credentialsForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="passwordCurrentPassword">Тековна лозинка *</label>
                  <input
                    type="password"
                    id="passwordCurrentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="За да потврдите промени, внесете ја тековната лозинка"
                    autoComplete="current-password"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="newPassword">Нова лозинка *</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Минимум 6 карактери"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword">Потврди нова лозинка *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Повторете ја новата лозинка"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className={styles.submitSection}>
                  <button type="submit" className={styles.submitBtn} disabled={updatingPassword}>
                    {updatingPassword ? 'Се ажурира...' : 'Зачувај лозинка'}
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

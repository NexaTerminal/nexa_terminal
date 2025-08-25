import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import styles from '../../styles/terminal/EditProfile.module.css';

const EditProfile = () => {
  const { currentUser, token } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    companyName: '',
    mission: '',
    website: '',
    industry: '',
    companySize: '',
    role: '',
    description: '',
    crnNumber: '',
    address: '',
    phone: '',
    companyPIN: '',
    taxNumber: '',
    contactEmail: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Industry options
  const industryOptions = [
    'Технологии',
    'Финансии',
    'Здравство',
    'Образование',
    'Трговија',
    'Производство',
    'Услуги',
    'Градежништво',
    'Транспорт',
    'Туризм',
    'Земјоделство',
    'Енергетика',
    'Друго'
  ];

  // Company size options
  const companySizeOptions = [
    '1-10 вработени',
    '11-50 вработени',
    '51-200 вработени',
    '201-500 вработени',
    '500+ вработени'
  ];

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = () => {
      if (currentUser) {
        setFormData({
          email: currentUser.email || '',
          companyName: currentUser.companyInfo?.companyName || '',
          mission: currentUser.companyInfo?.mission || '',
          website: currentUser.companyInfo?.website || '',
          industry: currentUser.companyInfo?.industry || '',
          companySize: currentUser.companyInfo?.companySize || '',
          role: currentUser.companyInfo?.role || '',
          description: currentUser.companyInfo?.description || '',
          crnNumber: currentUser.companyInfo?.crnNumber || '',
          address: currentUser.companyInfo?.address || '',
          phone: currentUser.companyInfo?.phone || '',
          companyPIN: currentUser.companyInfo?.companyPIN || '',
          taxNumber: currentUser.companyInfo?.taxNumber || '',
          contactEmail: currentUser.companyInfo?.contactEmail || ''
        });
        setLoading(false);
      }
    };

    loadUserData();
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Prepare company info data
      const companyInfo = { ...formData };
      delete companyInfo.email; // Remove email from company info

      // Update company info
      const companyResponse = await fetch('/api/users/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(companyInfo)
      });

      if (!companyResponse.ok) {
        throw new Error('Failed to update company info');
      }

      // Update user profile
      const profileResponse = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: formData.email
        })
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to update profile');
      }

      setSuccess('Профилот е успешно ажуриран!');
      
      // Show success message for 2 seconds then redirect
      setTimeout(() => {
        navigate('/terminal');
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        isAuthError: error.isAuthError
      });
      
      if (error.isAuthError || error.status === 401) {
        setError('Сесијата е истечена. Најавете се повторно.');
      } else if (error.status === 400) {
        setError('Невалидни податоци. Проверете ги внесените информации.');
      } else if (error.status === 403) {
        setError('Немате дозвола за ова дејство.');
      } else if (error.status === 500) {
        setError('Серверска грешка. Обидете се повторно подоцна.');
      } else {
        setError(`Настана грешка при ажурирање на профилот: ${error.message || 'Непозната грешка'}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.editProfile}>
        <div className={styles.loading}>Се вчитуваат податоци...</div>
      </div>
    );
  }

  return (
    <div className={styles.editProfile}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Уредување на профил</h1>
          <p>Ажурирајте ги вашите лични и компаниски податоци</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Personal Information Section */}
          <div className={styles.section}>
            <h2>Лични податоци</h2>
            
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email адреса</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                required
              />
            </div>
          </div>

          {/* Company Information Section */}
          <div className={styles.section}>
            <h2>Компаниски податоци</h2>
            
            <div className={styles.row}>
              <div className={styles.inputGroup}>
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

              <div className={styles.inputGroup}>
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
            </div>

            <div className={styles.inputGroup}>
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

            <div className={styles.row}>
              <div className={styles.inputGroup}>
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

              <div className={styles.inputGroup}>
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
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="description">Опис на компанијата</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Опишете ги активностите и услугите на вашата компанија..."
                rows={4}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
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

              <div className={styles.inputGroup}>
                <label htmlFor="contactEmail">Контакт email</label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  placeholder="contact@company.com"
                />
              </div>
            </div>
          </div>

          {/* Legal and Contact Information */}
          <div className={styles.section}>
            <h2>Правни и контакт податоци</h2>
            
            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label htmlFor="crnNumber">Матичен број</label>
                <input
                  type="text"
                  id="crnNumber"
                  name="crnNumber"
                  value={formData.crnNumber}
                  onChange={handleInputChange}
                  placeholder="1234567"
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="taxNumber">Даночен број</label>
                <input
                  type="text"
                  id="taxNumber"
                  name="taxNumber"
                  value={formData.taxNumber}
                  onChange={handleInputChange}
                  placeholder="4080012345678"
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label htmlFor="companyPIN">ПИН на компанија</label>
                <input
                  type="text"
                  id="companyPIN"
                  name="companyPIN"
                  value={formData.companyPIN}
                  onChange={handleInputChange}
                  placeholder="123456789"
                />
              </div>

              <div className={styles.inputGroup}>
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

            <div className={styles.inputGroup}>
              <label htmlFor="address">Адреса</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Улица, број, град"
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button 
              type="button" 
              onClick={() => navigate('/terminal')}
              className={styles.cancelButton}
            >
              Откажи
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className={styles.saveButton}
            >
              {saving ? 'Зачувување...' : 'Зачувај промени'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;

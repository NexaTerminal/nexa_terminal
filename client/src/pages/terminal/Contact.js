import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import styles from '../../styles/terminal/Contact.module.css';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import ProfileReminderBanner from '../../components/terminal/ProfileReminderBanner';
import { useAuth } from '../../contexts/AuthContext';

const Contact = () => {
  const { token, currentUser } = useAuth();
  const location = useLocation();
  const isTerminal = location.pathname.startsWith('/terminal');
  const [formData, setFormData] = useState({
    name: currentUser?.companyInfo?.companyName || '',
    email: currentUser?.email || '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      // Get CSRF token
      const csrfResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const { csrfToken } = await csrfResponse.json();

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Неуспешно поднесување на формуларот за контакт');
      }
      
      setSuccess('Вашата порака е успешно испратена!');
      setFormData({
        ...formData,
        message: ''
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header isTerminal={isTerminal} />
      
      <div className={styles["dashboard-layout"]}>
        <Sidebar />

        <main className={styles["dashboard-main"]}>
          <ProfileReminderBanner />
          
          <div className={styles['contact-container']}>
            <div className={styles['contact-header']}>
              <h1>Контакт</h1>
              <p>Контактирајте не за било какви прашања или поддршка.</p>
            </div>
          
          <div className={styles['contact-form']}>
            {error && <div className={styles['error-message']}>{error}</div>}
            {success && <div className={styles['success-message']}>{success}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className={styles['form-group']}>
                <label htmlFor="name" className={styles['form-label']}>Име</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className={styles['form-input']}
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className={styles['form-group']}>
                <label htmlFor="email" className={styles['form-label']}>Е-пошта</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={styles['form-input']}
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className={styles['form-group']}>
                <label htmlFor="message" className={styles['form-label']}>Порака</label>
                <textarea
                  id="message"
                  name="message"
                  className={styles['form-textarea']}
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className={styles['submit-button']}
                disabled={loading}
              >
                {loading ? 'Се испраќа...' : 'Испрати порака'}
              </button>
            </form>
          </div>
        </div>
        </main>
        </div>
    </div>
  );
};

export default Contact;

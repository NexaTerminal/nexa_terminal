import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import styles from '../../../styles/terminal/admin/AddInvestment.module.css';
import Header from '../../../components/common/Header';
import Footer from '../../../components/common/Footer';
import Sidebar from '../../../components/terminal/Sidebar';
import ProfileRequired from '../../../components/common/ProfileRequired';

const AddInvestment = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    duration: '',
    returnRate: '',
    riskLevel: 'low',
    sector: '',
    location: '',
    requirements: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

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

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/investments`, {
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
        const errorText = await response.text(); 
        throw new Error(errorText || 'Грешка при додавање на инвестицијата');
      }

      setSuccess('Инвестицијата е успешно додадена!');
      setFormData({
        title: '',
        description: '',
        amount: '',
        duration: '',
        returnRate: '',
        riskLevel: 'low',
        sector: '',
        location: '',
        requirements: '',
        status: 'active'
      });
      
      setTimeout(() => {
        navigate('/terminal/investments');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Настана грешка при додавање на инвестицијата.');
    } finally {
      setLoading(false);
    }
  };

  const riskLevels = [
    { value: 'low', label: 'Низок' },
    { value: 'medium', label: 'Среден' },
    { value: 'high', label: 'Висок' }
  ];

  return (
    <ProfileRequired>
      <div>
        <Header isTerminal={true} />
        
        <div className={styles["dashboard-layout"]}>
          <Sidebar />
          
          <main className={styles["dashboard-main"]}>
            <div className={styles.container}>
              <h1>Додај нова инвестиција</h1>

              {error && <div className={styles.error}>{error}</div>}
              {success && <div className={styles.success}>{success}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Наслов*</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Опис*</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            className={styles.textarea}
            rows="5"
          />
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label htmlFor="amount">Износ*</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              required
              min="0"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="duration">Времетраење*</label>
            <input
              type="text"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              required
              className={styles.input}
              placeholder='пр. 12 месеци'
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label htmlFor="returnRate">Стапка на поврат*</label>
            <input
              type="text"
              id="returnRate"
              name="returnRate"
              value={formData.returnRate}
              onChange={handleInputChange}
              required
              className={styles.input}
              placeholder="пр. 5-7%"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="riskLevel">Ниво на ризик*</label>
            <select
              id="riskLevel"
              name="riskLevel"
              value={formData.riskLevel}
              onChange={handleInputChange}
              required
              className={styles.select}
            >
              {riskLevels.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label htmlFor="sector">Сектор*</label>
            <input
              type="text"
              id="sector"
              name="sector"
              value={formData.sector}
              onChange={handleInputChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="location">Локација*</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="requirements">Барања</label>
          <textarea
            id="requirements"
            name="requirements"
            value={formData.requirements}
            onChange={handleInputChange}
            className={styles.textarea}
            rows="4"
          />
        </div>

        <div className={styles.buttonGroup}>
          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Се зачувува...' : 'Зачувај'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/terminal/investments')}
            className={styles.cancelButton}
          >
            Откажи
          </button>
        </div>
      </form>
          </div>
        </main>
      </div>
      
      <Footer isTerminal={true} />
    </div>
    </ProfileRequired>
  );
};

export default AddInvestment;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/terminal/InvestmentDetail.module.css';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import ProfileReminderBanner from '../../components/terminal/ProfileReminderBanner';

const InvestmentDetail = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [investment, setInvestment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvestment = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/investments/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setInvestment(data);
        } else {
          setError('Инвестицијата не е пронајдена');
        }
      } catch (error) {
        setError('Грешка при вчитување на инвестицијата');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInvestment();
    }
  }, [id, token]);

  if (loading) {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles["dashboard-layout"]}>
          <Sidebar />
          <main className={styles["dashboard-main"]}>
            <div className={styles.container}>
              <p>Се вчитува инвестицијата...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !investment) {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles["dashboard-layout"]}>
          <Sidebar />
          <main className={styles["dashboard-main"]}>
            <div className={styles.container}>
              <div className={styles.error}>
                <h2>Грешка</h2>
                <p>{error || 'Инвестицијата не е пронајдена'}</p>
                <button onClick={() => navigate('/terminal/investments')} className={styles.backButton}>
                  Назад кон инвестициите
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header isTerminal={true} />
      
      <div className={styles["dashboard-layout"]}>
        <Sidebar />

        <main className={styles["dashboard-main"]}>
          <ProfileReminderBanner />
          
          <div className={styles.container}>
            <div className={styles.header}>
              <button onClick={() => navigate('/terminal/investments')} className={styles.backButton}>
                ← Назад кон инвестициите
              </button>
            </div>

            <div className={styles.investmentDetail}>
              <div className={styles.investmentHeader}>
                <h1>{investment.title}</h1>
                <div className={styles.investmentMeta}>
                  <span className={styles.sector}>{investment.sector}</span>
                  <span className={styles.location}>{investment.location}</span>
                  <span className={`${styles.riskLevel} ${styles[investment.riskLevel]}`}>
                    Ризик: {investment.riskLevel === 'low' ? 'Низок' : investment.riskLevel === 'medium' ? 'Среден' : 'Висок'}
                  </span>
                </div>
              </div>

              <div className={styles.investmentContent}>
                <div className={styles.mainInfo}>
                  <div className={styles.description}>
                    <h3>Опис</h3>
                    <p>{investment.description}</p>
                  </div>

                  {investment.requirements && (
                    <div className={styles.requirements}>
                      <h3>Барања</h3>
                      <p>{investment.requirements}</p>
                    </div>
                  )}
                </div>

                <div className={styles.investmentStats}>
                  <div className={styles.statCard}>
                    <h4>Инвестиционен износ</h4>
                    <p className={styles.amount}>{investment.amount}€</p>
                  </div>

                  {investment.duration && (
                    <div className={styles.statCard}>
                      <h4>Времетраење</h4>
                      <p>{investment.duration}</p>
                    </div>
                  )}

                  {investment.returnRate && (
                    <div className={styles.statCard}>
                      <h4>Стапка на поврат</h4>
                      <p>{investment.returnRate}</p>
                    </div>
                  )}

                  <div className={styles.statCard}>
                    <h4>Статус</h4>
                    <span className={`${styles.status} ${styles[investment.status]}`}>
                      {investment.status === 'active' ? 'Активна' : 
                       investment.status === 'closed' ? 'Затворена' : 'Во тек'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.investmentFooter}>
                <p className={styles.createdAt}>
                  Објавено на: {new Date(investment.createdAt).toLocaleDateString('mk-MK')}
                </p>
                {investment.views > 0 && (
                  <p className={styles.views}>
                    Прегледи: {investment.views}
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default InvestmentDetail; 
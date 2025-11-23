import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCredit } from '../../contexts/CreditContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import styles from '../../styles/terminal/Credits.module.css';

const Credits = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { credits, loading: creditsLoading, refreshCredits } = useCredit();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [txnResponse, statsResponse, refResponse] = await Promise.all([
        api.get('/api/credits/transactions?limit=20'),
        api.get('/api/credits/stats'),
        api.get('/api/referrals/stats')
      ]);

      setTransactions(txnResponse.data.transactions || []);
      setStats(statsResponse.data.stats || {});
      setReferralStats(refResponse.data.stats || {});
    } catch (error) {
      console.error('Failed to fetch credit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (referralStats?.referralCode) {
      const link = `${window.location.origin}/register?ref=${referralStats.referralCode}`;
      navigator.clipboard.writeText(link);
      alert('Линкот е копиран!');
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('mk-MK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    const icons = {
      'WEEKLY_RESET': '🔄',
      'DOCUMENT_GENERATION': '📄',
      'AI_QUESTION': '🤖',
      'LHC_REPORT': '⚖️',
      'REFERRAL_BONUS': '🎁',
      'ADMIN_ADJUSTMENT': '⚙️',
      'REFUND': '↩️',
      'INITIAL_CREDIT': '✨'
    };
    return icons[type] || '💳';
  };

  const getTransactionLabel = (type) => {
    const labels = {
      'WEEKLY_RESET': 'Неделно ресетирање',
      'DOCUMENT_GENERATION': 'Генериран документ',
      'AI_QUESTION': 'AI прашање',
      'LHC_REPORT': 'Правен извештај',
      'REFERRAL_BONUS': 'Бонус од препорака',
      'ADMIN_ADJUSTMENT': 'Административна промена',
      'REFUND': 'Рефундирање',
      'INITIAL_CREDIT': 'Почетни кредити'
    };
    return labels[type] || type;
  };

  if (creditsLoading || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Се вчитува...</p>
        </div>
      </div>
    );
  }

  const percentage = credits ? (credits.balance / credits.weeklyAllocation) * 100 : 0;
  const isLow = credits && credits.balance <= 3;
  const isDepleted = credits && credits.balance === 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Мои Кредити</h1>
        <button onClick={refreshCredits} className={styles.refreshBtn}>
          🔄 Освежи
        </button>
      </div>

      {/* Credit Overview Card */}
      <div className={styles.overviewCard}>
        <div className={styles.creditDisplay}>
          <div className={styles.creditCircle}>
            <svg className={styles.progressRing} width="160" height="160">
              <circle
                className={styles.progressRingBg}
                stroke="#e5e7eb"
                strokeWidth="12"
                fill="transparent"
                r="70"
                cx="80"
                cy="80"
              />
              <circle
                className={`${styles.progressRingProgress} ${isLow ? styles.lowCredit : ''} ${isDepleted ? styles.depleted : ''}`}
                stroke={isDepleted ? '#dc2626' : isLow ? '#f59e0b' : '#10b981'}
                strokeWidth="12"
                fill="transparent"
                r="70"
                cx="80"
                cy="80"
                strokeDasharray={`${(percentage / 100) * 439.6} 439.6`}
                strokeDashoffset="0"
              />
            </svg>
            <div className={styles.creditNumber}>
              <span className={styles.balance}>{credits?.balance || 0}</span>
              <span className={styles.total}>/ {credits?.weeklyAllocation || 14}</span>
            </div>
          </div>

          <div className={styles.creditInfo}>
            <h2>Достапни Кредити</h2>
            <p className={styles.resetInfo}>
              Следно ресетирање: <strong>{formatDate(credits?.nextResetDate)}</strong>
            </p>
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Вкупно заработени</span>
                <span className={styles.statValue}>{credits?.lifetimeEarned || 0}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Вкупно потрошени</span>
                <span className={styles.statValue}>{credits?.lifetimeSpent || 0}</span>
              </div>
            </div>

            {isDepleted && (
              <div className={styles.warningBox}>
                <span className={styles.warningIcon}>⚠️</span>
                <div>
                  <strong>Немате повеќе кредити!</strong>
                  <p>Поканете пријатели или почекајте до следното ресетирање.</p>
                </div>
              </div>
            )}

            {isLow && !isDepleted && (
              <div className={styles.infoBox}>
                <span className={styles.infoIcon}>ℹ️</span>
                <div>
                  <strong>Малку кредити!</strong>
                  <p>Поканете 3+ пријатели за +7 бонус кредити.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Преглед
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'transactions' ? styles.active : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          📜 Историја
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'referrals' ? styles.active : ''}`}
          onClick={() => setActiveTab('referrals')}
        >
          🎁 Препораки
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.overview}>
            <h3>Неделна употреба</h3>
            <div className={styles.usageGrid}>
              <div className={styles.usageCard}>
                <div className={styles.usageIcon}>📄</div>
                <div className={styles.usageInfo}>
                  <span className={styles.usageLabel}>Документи</span>
                  <span className={styles.usageValue}>{stats?.documentGeneration || 0}</span>
                </div>
              </div>
              <div className={styles.usageCard}>
                <div className={styles.usageIcon}>🤖</div>
                <div className={styles.usageInfo}>
                  <span className={styles.usageLabel}>AI Прашања</span>
                  <span className={styles.usageValue}>{stats?.aiQuestions || 0}</span>
                </div>
              </div>
              <div className={styles.usageCard}>
                <div className={styles.usageIcon}>⚖️</div>
                <div className={styles.usageInfo}>
                  <span className={styles.usageLabel}>Правни извештаи</span>
                  <span className={styles.usageValue}>{stats?.lhcReports || 0}</span>
                </div>
              </div>
              <div className={styles.usageCard}>
                <div className={styles.usageIcon}>💰</div>
                <div className={styles.usageInfo}>
                  <span className={styles.usageLabel}>Вкупно потрошени</span>
                  <span className={styles.usageValue}>{stats?.totalSpent || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className={styles.transactions}>
            <h3>Историја на трансакции</h3>
            {transactions.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Нема трансакции засега</p>
              </div>
            ) : (
              <div className={styles.transactionList}>
                {transactions.map((tx) => (
                  <div key={tx._id} className={styles.transactionItem}>
                    <div className={styles.txIcon}>{getTransactionIcon(tx.type)}</div>
                    <div className={styles.txInfo}>
                      <span className={styles.txLabel}>{getTransactionLabel(tx.type)}</span>
                      <span className={styles.txDate}>{formatDate(tx.createdAt)}</span>
                    </div>
                    <div className={`${styles.txAmount} ${tx.amount > 0 ? styles.positive : styles.negative}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'referrals' && (
          <div className={styles.referrals}>
            <div className={styles.referralHeader}>
              <h3>Препорачај и заработи</h3>
              <p>Поканете 3+ пријатели и добијте +7 бонус кредити неделно!</p>
            </div>

            <div className={styles.referralCode}>
              <label>Твој код за препорака:</label>
              <div className={styles.codeBox}>
                <input
                  type="text"
                  value={referralStats?.referralCode || 'Генерирање...'}
                  readOnly
                  className={styles.codeInput}
                />
                <button onClick={copyReferralLink} className={styles.copyBtn}>
                  📋 Копирај линк
                </button>
              </div>
            </div>

            <div className={styles.referralStats}>
              <div className={styles.refStatCard}>
                <span className={styles.refStatValue}>{referralStats?.activeInvites || 0}</span>
                <span className={styles.refStatLabel}>Активни препораки</span>
              </div>
              <div className={styles.refStatCard}>
                <span className={styles.refStatValue}>{referralStats?.pendingInvites || 0}</span>
                <span className={styles.refStatLabel}>Во очекување</span>
              </div>
              <div className={styles.refStatCard}>
                <span className={styles.refStatValue}>{referralStats?.nextBonusIn || 0}</span>
                <span className={styles.refStatLabel}>До следен бонус</span>
              </div>
              <div className={styles.refStatCard}>
                <span className={styles.refStatValue}>{referralStats?.lifetimeBonusEarned || 0}</span>
                <span className={styles.refStatLabel}>Вкупен бонус</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/terminal/invite')}
              className={styles.inviteBtn}
            >
              ✉️ Покани пријатели
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Credits;

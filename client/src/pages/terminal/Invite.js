import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import styles from '../../styles/terminal/Invite.module.css';

const Invite = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [referralStats, setReferralStats] = useState(null);
  const [emailInput, setEmailInput] = useState('');
  const [emailList, setEmailList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/referrals/stats');
      setReferralStats(response.data.stats || {});
    } catch (error) {
      console.error('Failed to fetch referral stats:', error);
      setErrorMessage('Не можевме да ги вчитаме статистиките.');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (referralStats?.referralCode) {
      const link = `${window.location.origin}/register?ref=${referralStats.referralCode}`;
      navigator.clipboard.writeText(link);
      setSuccessMessage('Линкот е копиран!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const addEmail = () => {
    const trimmedEmail = emailInput.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Внесете валидна email адреса.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    // Check for duplicates
    if (emailList.includes(trimmedEmail)) {
      setErrorMessage('Оваа email адреса е веќе додадена.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setEmailList([...emailList, trimmedEmail]);
    setEmailInput('');
  };

  const removeEmail = (emailToRemove) => {
    setEmailList(emailList.filter(email => email !== emailToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const sendInvitations = async () => {
    if (emailList.length === 0) {
      setErrorMessage('Додајте барем една email адреса.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    try {
      setSending(true);
      setErrorMessage('');
      setSuccessMessage('');

      const response = await api.post('/api/referrals/invite', {
        emails: emailList
      });

      if (response.data.success) {
        setSuccessMessage(`Успешно испратени ${emailList.length} покани!`);
        setEmailList([]);
        // Refresh stats
        await fetchReferralStats();
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      console.error('Failed to send invitations:', error);
      setErrorMessage(error.response?.data?.message || 'Не можевме да ги испратиме поканите.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Се вчитува...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={() => navigate('/terminal/credits')} className={styles.backBtn}>
          ← Назад
        </button>
        <h1>Покани пријатели</h1>
      </div>

      {/* Banner */}
      <div className={styles.banner}>
        <div className={styles.bannerIcon}>🎁</div>
        <div className={styles.bannerContent}>
          <h2>Заработи +7 бонус кредити неделно!</h2>
          <p>
            Поканете 3 или повеќе пријатели кои ќе се регистрираат и верификуваат,
            и добивајте <strong>7 дополнителни кредити</strong> секоја недела.
          </p>
        </div>
      </div>

      {/* Referral Code Section */}
      <div className={styles.codeSection}>
        <h3>Твој код за препорака</h3>
        <div className={styles.codeBox}>
          <div className={styles.codeDisplay}>
            {referralStats?.referralCode || 'Генерирање...'}
          </div>
          <button onClick={copyReferralLink} className={styles.copyBtn}>
            📋 Копирај линк
          </button>
        </div>
        <p className={styles.codeHint}>
          Споделете го овој линк: {' '}
          <code className={styles.linkPreview}>
            {window.location.origin}/register?ref={referralStats?.referralCode}
          </code>
        </p>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statValue}>{referralStats?.activeInvites || 0}</div>
          <div className={styles.statLabel}>Активни препораки</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⏳</div>
          <div className={styles.statValue}>{referralStats?.pendingInvites || 0}</div>
          <div className={styles.statLabel}>Во очекување</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎯</div>
          <div className={styles.statValue}>{referralStats?.nextBonusIn || 0}</div>
          <div className={styles.statLabel}>До следен бонус</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statValue}>{referralStats?.lifetimeBonusEarned || 0}</div>
          <div className={styles.statLabel}>Вкупен бонус</div>
        </div>
      </div>

      {/* Email Invitation Section */}
      <div className={styles.inviteSection}>
        <h3>Испрати покани преку email</h3>

        <div className={styles.inputGroup}>
          <input
            type="email"
            className={styles.emailInput}
            placeholder="Внесете email адреса..."
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
          />
          <button
            onClick={addEmail}
            className={styles.addBtn}
            disabled={sending || !emailInput.trim()}
          >
            + Додај
          </button>
        </div>

        {/* Email List */}
        {emailList.length > 0 && (
          <div className={styles.emailList}>
            <div className={styles.emailListHeader}>
              <span>Листа на email адреси ({emailList.length})</span>
              <button
                onClick={() => setEmailList([])}
                className={styles.clearAllBtn}
              >
                Избриши ги сите
              </button>
            </div>
            <div className={styles.emailItems}>
              {emailList.map((email, index) => (
                <div key={index} className={styles.emailItem}>
                  <span className={styles.emailText}>{email}</span>
                  <button
                    onClick={() => removeEmail(email)}
                    className={styles.removeBtn}
                    aria-label={`Remove ${email}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={sendInvitations}
          className={styles.sendBtn}
          disabled={sending || emailList.length === 0}
        >
          {sending ? (
            <>
              <div className={styles.btnSpinner}></div>
              Се испраќаат...
            </>
          ) : (
            <>
              ✉️ Испрати {emailList.length > 0 ? `${emailList.length} ` : ''}покани
            </>
          )}
        </button>

        {/* Messages */}
        {successMessage && (
          <div className={styles.successMessage}>
            ✅ {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className={styles.errorMessage}>
            ❌ {errorMessage}
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className={styles.howItWorks}>
        <h3>Како функционира?</h3>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepContent}>
              <h4>Покани пријатели</h4>
              <p>Споделете го вашиот референтен код или линк со пријатели и колеги.</p>
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepContent}>
              <h4>Тие се регистрираат</h4>
              <p>Вашите пријатели се регистрираат користејќи го вашиот код.</p>
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepContent}>
              <h4>Верификација</h4>
              <p>Откако ќе се верификуваат како компании, тие стануваат активни препораки.</p>
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>4</div>
            <div className={styles.stepContent}>
              <h4>Добивате бонус</h4>
              <p>Со 3+ активни препораки, автоматски добивате +7 кредити секоја недела!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invite;

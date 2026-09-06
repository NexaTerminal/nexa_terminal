import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';
import styles from '../../styles/terminal/TierOnboardingModal.module.css';

/**
 * First-login identity prompt.
 *
 * Google users (and any account flagged needsTierOnboarding) never saw the
 * signup-form chooser, so we ask once here: business (Basic) vs lawyer (Pro).
 * The choice sets plan + role via /auth/choose-account-type. The modal is not
 * dismissible without choosing — it's a required onboarding step.
 */
const TierOnboardingModal = () => {
  const { currentUser, setCurrentUser } = useAuth();
  // Pre-select the user's CURRENT identity so existing users just confirm (and a
  // correctly-classified lawyer can't accidentally downgrade to Basic).
  const currentIsPro = currentUser?.role === 'admin_user' || currentUser?.subscription?.plan === 'pro';
  const [plan, setPlan] = useState(currentIsPro ? 'pro' : 'basic');
  const [license, setLicense] = useState(currentUser?.proVerification?.license || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!currentUser || currentUser.needsTierOnboarding !== true) return null;

  const submit = async () => {
    setError('');
    if (plan === 'pro' && !license.trim()) {
      setError('Внесете број на лиценца или ЕМБС за да продолжите како адвокат.');
      return;
    }
    setLoading(true);
    try {
      const res = await ApiService.request('/auth/choose-account-type', {
        method: 'POST',
        body: JSON.stringify({ plan, license: license.trim() })
      });
      if (res && res.user) {
        setCurrentUser(res.user);
      } else {
        // Fallback: clear the flag locally so the modal closes.
        setCurrentUser({ ...currentUser, needsTierOnboarding: false });
      }
    } catch (err) {
      setError(err.message || 'Настана грешка. Обидете се повторно.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <h2 className={styles.title}>Потврдете го типот на вашата сметка</h2>
        <p className={styles.subtitle}>Ова ни помага да ви ги покажеме вистинските алатки.</p>

        <div className={styles.options}>
          <button
            type="button"
            className={`${styles.option} ${plan === 'basic' ? styles.optionActive : ''}`}
            onClick={() => setPlan('basic')}
            aria-pressed={plan === 'basic'}
          >
            <span className={styles.optionName}>За мојата фирма</span>
            <span className={styles.optionDesc}>Документи, усогласеност и деловни алатки</span>
          </button>
          <button
            type="button"
            className={`${styles.option} ${plan === 'pro' ? styles.optionActive : ''}`}
            onClick={() => setPlan('pro')}
            aria-pressed={plan === 'pro'}
          >
            <span className={styles.optionName}>Адвокат</span>
            <span className={styles.optionDesc}>Ќе го користам за да најдам клиенти и за да поедноставам услуги за нив</span>
          </button>
        </div>

        {plan === 'pro' && (
          <div className={styles.field}>
            <label htmlFor="onb-license" className={styles.label}>Број на лиценца или ЕМБС</label>
            <input
              id="onb-license"
              type="text"
              className={styles.input}
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              placeholder="пр. број на адвокатска лиценца или ЕМБС"
            />
            <p className={styles.hint}>Го користиме само за да потврдиме дека сте адвокат пред да го одобриме пристапот.</p>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <button type="button" className={styles.submit} onClick={submit} disabled={loading}>
          {loading ? 'Се зачувува…' : 'Продолжи'}
        </button>
      </div>
    </div>
  );
};

export default TierOnboardingModal;

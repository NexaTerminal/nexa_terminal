import { useTranslation } from 'react-i18next';
import styles from './TrialDisabledNotice.module.css';

/**
 * Soft amber strip that renders inside trial-locked B/C surfaces.
 * One line + one CTA that re-opens the SubscriptionGate via the existing
 * `subscription:blocked` window event.
 */
export default function TrialDisabledNotice() {
  const { t } = useTranslation();

  const openGate = () => {
    try {
      window.dispatchEvent(new CustomEvent('subscription:blocked', {
        detail: { code: 'SUBSCRIPTION_USER_INITIATED', message: 'Trial-locked feature' }
      }));
    } catch (_) { /* old browser */ }
  };

  return (
    <div className={styles.notice} role="status">
      <span className={styles.icon} aria-hidden>⏱</span>
      <span className={styles.text}>
        {t('trial.disabledNotice', 'Достапно по активирање на платена претплата.')}
      </span>
      <button type="button" onClick={openGate} className={styles.cta}>
        {t('trial.disabledCta', 'Видете планови')} <span aria-hidden>→</span>
      </button>
    </div>
  );
}

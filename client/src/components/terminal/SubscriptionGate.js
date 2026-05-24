import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import styles from './SubscriptionGate.module.css';

const PRICES = {
  standard: { monthly: 40,  quarterly: 90,  annual: 360 },
  admin_5:  { monthly: 80,  quarterly: 240, annual: 720 },
  admin_10: { monthly: 150, quarterly: 450, annual: 1350 }
};
const PLAN_LABEL = {
  standard: 'Стандарден',
  admin_5:  'Admin · 5 седишта',
  admin_10: 'Admin · 10 седишта'
};

/**
 * Event-driven subscription gate.
 *
 * Mounted globally inside PrivateRoute, but renders NOTHING by default —
 * the user can navigate freely. When any API call returns 402 with a
 * SUBSCRIPTION_* code, the global axios interceptor (in AuthContext.js)
 * dispatches a `subscription:blocked` event. This component listens and opens.
 *
 * Modal contents adapt to context:
 *   - If account has no email → email input is shown
 *   - If grace already used  → "Send invoice" CTA is hidden, only "Subscribe & pay" remains
 *   - For admin_user role     → plan picker (admin_5 vs admin_10)
 *   - Default cycle: monthly  (user can switch to quarterly/annual)
 */
export default function SubscriptionGate() {
  const { token, currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [blockedInfo, setBlockedInfo] = useState(null);
  const [cycle, setCycle] = useState('monthly');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  // Listen for global subscription:blocked events.
  useEffect(() => {
    const onBlocked = (e) => {
      // Don't pop the modal for sub-seats; their parent's status is the issue.
      if (currentUser?.role === 'sub_seat') return;
      // Don't pop for platform admin.
      if (currentUser?.role === 'admin') return;

      setBlockedInfo(e.detail || null);
      setError('');
      setDone(null);
      setOpen(true);
    };
    window.addEventListener('subscription:blocked', onBlocked);
    return () => window.removeEventListener('subscription:blocked', onBlocked);
  }, [currentUser]);

  // Init plan/cycle based on user role + the blocking event's hints.
  useEffect(() => {
    if (!open) return;
    const sub = blockedInfo?.subscription || {};
    setCycle(sub.cycle && sub.cycle !== 'trial' ? sub.cycle : 'monthly');
    const defaultPlan = currentUser?.role === 'admin_user'
      ? (sub.plan === 'admin_10' ? 'admin_10' : 'admin_5')
      : (sub.plan && sub.plan !== 'trial' ? sub.plan : 'standard');
    setPlan(defaultPlan);
    setEmail(currentUser?.email || '');
  }, [open, blockedInfo, currentUser]);

  if (!open) return null;
  if (!currentUser) return null;

  const sub = blockedInfo?.subscription || {};
  const graceUsed = sub.graceUsed === true;
  const userHasEmail = !!(currentUser.email && currentUser.email.includes('@'));
  const plansForRole = currentUser.role === 'admin_user'
    ? ['admin_5', 'admin_10']
    : ['standard'];
  const price = plan ? PRICES[plan]?.[cycle] : null;

  const headerTitle = sub.status === 'suspended'
    ? 'Пробниот период истече'
    : sub.status === 'pending_approval'
      ? 'Барањето чека одобрување'
      : 'Изберете план за да продолжите';

  const submit = async (kind) => {
    if (!plan) return;
    // Email is required when account has none — collect it now.
    if (!userHasEmail && (!email || !email.includes('@'))) {
      setError('Внесете валидна е-пошта за да испратиме инструкции за уплата.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const url = kind === 'invoice'
        ? '/api/subscription/request-invoice'
        : '/api/subscription/request-approval';
      const body = { plan, cycle };
      if (!userHasEmail && email) body.billingEmail = email;
      else if (userHasEmail && email && email !== currentUser.email) body.billingEmail = email;
      await axios.post(url, body, { headers: { Authorization: `Bearer ${token}` } });
      setDone(kind);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    setOpen(false);
    setDone(null);
    setError('');
  };

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" onClick={close}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={close} aria-label="Затвори">×</button>

        {done ? (
          <div className={styles.successBlock}>
            <div className={styles.checkIcon} aria-hidden>✓</div>
            <h2 className={styles.title}>Готово</h2>
            <p className={styles.lead}>
              {done === 'invoice'
                ? 'Проверете ја вашата е-пошта. Имате 3 дена дополнителен пристап додека ја обработуваме уплатата.'
                : 'Проверете ја вашата е-пошта за инструкциите за уплата.'}
            </p>
            <button className={styles.btnPrimary} onClick={close}>Затвори</button>
          </div>
        ) : (
          <>
            <div className={styles.eyebrow}>{headerTitle}</div>
            <h2 className={styles.title}>Продолжете со претплата</h2>
            <p className={styles.lead}>
              {graceUsed
                ? 'Веќе го искористивте 3-дневниот гејс период. Сега треба прво да пристигне уплатата.'
                : 'Изберете план и циклус. Ќе ви испратиме инструкции за уплата и автоматски ќе ви дадеме 3 дена дополнителен пристап.'}
            </p>

            {plansForRole.length > 1 && (
              <div className={styles.planTiles}>
                {plansForRole.map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`${styles.planTile} ${plan === p ? styles.planTileActive : ''}`}
                    onClick={() => setPlan(p)}
                  >
                    <div className={styles.planTileName}>{PLAN_LABEL[p]}</div>
                    <div className={styles.planTilePrice}>€{PRICES[p].monthly} / месец</div>
                  </button>
                ))}
              </div>
            )}

            <div className={styles.cycleLabel}>Циклус на наплата</div>
            <div className={styles.cycleRow}>
              {['monthly', 'quarterly', 'annual'].map(c => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.cycleBtn} ${cycle === c ? styles.cycleBtnActive : ''}`}
                  onClick={() => setCycle(c)}
                >
                  <div className={styles.cycleName}>
                    {c === 'monthly' ? 'Месечно' : c === 'quarterly' ? 'Квартално' : 'Годишно'}
                  </div>
                  <div className={styles.cyclePrice}>€{plan ? PRICES[plan][c] : '—'}</div>
                </button>
              ))}
            </div>

            {!userHasEmail && (
              <div className={styles.field}>
                <label>Е-пошта (за прием на инструкции и фактура)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vie@vasata-firma.mk"
                />
              </div>
            )}
            {userHasEmail && (
              <div className={styles.emailHint}>
                Инструкциите ќе ги пратиме на <strong>{currentUser.email}</strong>.
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.ctaCol}>
              {!graceUsed && (
                <button
                  type="button"
                  className={styles.btnPrimary}
                  disabled={submitting || !plan}
                  onClick={() => submit('invoice')}
                >
                  {submitting ? 'Се испраќа…' : 'Прати ми прединфактура'}
                  <span className={styles.ctaSub}>
                    Добивате 3 дена дополнителен пристап додека ја обработуваме уплатата.
                  </span>
                </button>
              )}
              <button
                type="button"
                className={graceUsed ? styles.btnPrimary : styles.btnSecondary}
                disabled={submitting || !plan}
                onClick={() => submit('subscribe')}
              >
                {submitting ? 'Се испраќа…' : graceUsed ? 'Претплати се сега' : 'Само инструкции за уплата'}
                {!graceUsed && (
                  <span className={styles.ctaSub}>Без дополнителен пристап. Активираме штом пристигне уплатата.</span>
                )}
              </button>
            </div>

            <div className={styles.bottomActions}>
              <button type="button" className={styles.btnText} onClick={close}>Не сега</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

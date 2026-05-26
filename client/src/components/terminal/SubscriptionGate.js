import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import styles from './SubscriptionGate.module.css';

// EUR prices using 9-endings. Match the public Pricing page.
const PRICES = {
  standard: { monthly: 39,  quarterly: 99,  annual: 359  },
  admin_5:  { monthly: 79,  quarterly: 199, annual: 719  },
  admin_10: { monthly: 149, quarterly: 379, annual: 1349 }
};
const PLAN_LABEL = {
  standard: 'Стандарден',
  admin_5:  'Admin · 5',
  admin_10: 'Admin · 10'
};
// Short MK description for the hover tooltip on each plan tile.
const PLAN_TOOLTIP = {
  standard: 'Еден корисник. Целосен пристап до Терминалот: документи, проверки за усогласеност, AI помош, анализа на договор.',
  admin_5:  'Сè во Стандарден + тим до 5 корисници + промотивни можности преку билтенот, сателитските сајтови и Topics.',
  admin_10: 'Истото како Admin · 5, со тим до 10 корисници и поголеми лимити.'
};
const PLAN_SHORT = {
  standard: '1 корисник',
  admin_5:  'Тим до 5',
  admin_10: 'Тим до 10'
};

const ALL_PLANS = ['standard', 'admin_5', 'admin_10'];

/**
 * Event-driven subscription gate.
 *
 * Mounted globally inside PrivateRoute, but renders NOTHING by default —
 * the user can navigate freely. The strip CTA or the global 402 interceptor
 * dispatch `subscription:blocked`. This component listens and opens.
 *
 * Single ordering flow: pick plan (3 tiles), pick cycle (3 tiles), confirm
 * email if missing, click ONE button — Нарачај. Backend auto-grants the
 * 3-day grace on first use; silently skips it after grace is consumed.
 */
export default function SubscriptionGate() {
  const { token, currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [blockedInfo, setBlockedInfo] = useState(null);
  const [cycle, setCycle] = useState('monthly');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('standard');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Listen for global subscription:blocked events.
  useEffect(() => {
    const onBlocked = (e) => {
      if (currentUser?.role === 'sub_seat') return;
      if (currentUser?.role === 'admin') return;
      setBlockedInfo(e.detail || null);
      setError('');
      setDone(false);
      setOpen(true);
    };
    window.addEventListener('subscription:blocked', onBlocked);
    return () => window.removeEventListener('subscription:blocked', onBlocked);
  }, [currentUser]);

  // Seed plan/cycle defaults from the user state when the modal opens.
  useEffect(() => {
    if (!open) return;
    const sub = blockedInfo?.subscription || {};
    setCycle(sub.cycle && sub.cycle !== 'trial' ? sub.cycle : 'monthly');
    const defaultPlan =
      sub.plan && ALL_PLANS.includes(sub.plan)        ? sub.plan
    : currentUser?.role === 'admin_user'              ? 'admin_5'
    :                                                   'standard';
    setPlan(defaultPlan);
    setEmail(currentUser?.email || '');
  }, [open, blockedInfo, currentUser]);

  if (!open) return null;
  if (!currentUser) return null;

  const sub = blockedInfo?.subscription || {};
  const graceUsed = sub.graceUsed === true;
  const userHasEmail = !!(currentUser.email && currentUser.email.includes('@'));
  const price = PRICES[plan]?.[cycle];

  const headerTitle =
      sub.status === 'suspended'         ? 'Пробниот период истече'
    : sub.status === 'pending_approval'  ? 'Барањето чека одобрување'
    :                                      'Изберете план за да продолжите';

  const cycleSuffix = cycle === 'monthly' ? '/ месец' : cycle === 'quarterly' ? '/ квартал' : '/ година';

  const submit = async () => {
    if (!plan) return;
    if (!userHasEmail && (!email || !email.includes('@'))) {
      setError('Внесете валидна е-пошта за да испратиме инструкции за уплата.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      // Always go through request-invoice. Backend grants the 3-day grace
      // automatically when the user is eligible (post-trial AND grace not yet
      // used). If grace is already used, it just records the request without
      // extending access — same single happy path either way.
      const body = { plan, cycle };
      if (!userHasEmail && email) body.billingEmail = email;
      else if (userHasEmail && email && email !== currentUser.email) body.billingEmail = email;
      await axios.post('/api/subscription/request-invoice', body, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDone(true);
      try { window.dispatchEvent(new CustomEvent('subscription:updated')); } catch (_) {}
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    setOpen(false);
    setDone(false);
    setError('');
  };

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" onClick={close}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={close} aria-label="Затвори">×</button>

        {done ? (
          <div className={styles.successBlock}>
            <div className={styles.checkIcon} aria-hidden>✓</div>
            <h2 className={styles.title}>Нарачката е примена</h2>
            <p className={styles.lead}>
              {graceUsed
                ? 'Проверете ја Вашата е-пошта за инструкциите за уплата. Активираме штом пристигне уплатата.'
                : 'Проверете ја Вашата е-пошта. Имате 3 дена дополнителен пристап додека ја обработуваме уплатата.'}
            </p>
            <button className={styles.btnPrimary} onClick={close}>Затвори</button>
          </div>
        ) : (
          <>
            <div className={styles.eyebrow}>{headerTitle}</div>
            <h2 className={styles.title}>Продолжете со претплата</h2>
            <p className={styles.lead}>
              {graceUsed
                ? 'Веќе го искористивте 3-дневниот грејс период. Сега треба прво да пристигне уплатата за активирање.'
                : 'Изберете план и циклус. Ќе Ви испратиме инструкции за уплата и автоматски ќе Ви дадеме 3 дена дополнителен пристап.'}
            </p>

            {/* ============ PLAN TILES (always 3) ============ */}
            <div className={styles.sectionLabel}>План</div>
            <div className={styles.planTiles3}>
              {ALL_PLANS.map(p => (
                <button
                  key={p}
                  type="button"
                  className={`${styles.planTile} ${plan === p ? styles.planTileActive : ''}`}
                  onClick={() => setPlan(p)}
                  aria-pressed={plan === p}
                >
                  <div className={styles.planTileName}>{PLAN_LABEL[p]}</div>
                  <div className={styles.planTileShort}>{PLAN_SHORT[p]}</div>
                  <div className={styles.planTilePriceLine}>
                    <span className={styles.planTilePriceNum}>€{PRICES[p].monthly}</span>
                    <span className={styles.planTilePriceUnit}>/ мес</span>
                  </div>
                </button>
              ))}
            </div>
            <p className={styles.planDescription}>{PLAN_TOOLTIP[plan]}</p>

            {/* ============ CYCLE TILES ============ */}
            <div className={styles.sectionLabel}>Циклус на наплата</div>
            <div className={styles.cycleRow}>
              {['monthly', 'quarterly', 'annual'].map(c => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.cycleBtn} ${cycle === c ? styles.cycleBtnActive : ''}`}
                  onClick={() => setCycle(c)}
                  aria-pressed={cycle === c}
                >
                  <span className={styles.cycleName}>
                    {c === 'monthly' ? 'Месечно' : c === 'quarterly' ? 'Квартално' : 'Годишно'}
                  </span>
                  <span className={styles.cyclePrice}>€{PRICES[plan][c]}</span>
                </button>
              ))}
            </div>

            {/* ============ EMAIL ============ */}
            {!userHasEmail ? (
              <div className={styles.field}>
                <label>Е-пошта (за прием на инструкции и фактура)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vie@vasata-firma.mk"
                />
              </div>
            ) : (
              <div className={styles.emailHint}>
                Инструкциите ќе Ви ги пратиме на <strong>{currentUser.email}</strong>.
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}

            {/* ============ SINGLE CTA ============ */}
            <button
              type="button"
              className={styles.btnOrder}
              disabled={submitting || !plan}
              onClick={submit}
            >
              <span className={styles.btnOrderLabel}>
                {submitting ? 'Се испраќа…' : 'Нарачај'}
              </span>
              {!submitting && (
                <span className={styles.btnOrderPrice}>
                  €{price} {cycleSuffix}
                </span>
              )}
            </button>

            <p className={styles.fineprint}>
              {graceUsed
                ? 'Активирањето е автоматско штом пристигне уплатата.'
                : 'По нарачката добивате 3 дена дополнителен пристап. Уплатата може да се изврши преку банкарски трансфер.'}
            </p>

            <div className={styles.bottomActions}>
              <button type="button" className={styles.btnText} onClick={close}>Не сега</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

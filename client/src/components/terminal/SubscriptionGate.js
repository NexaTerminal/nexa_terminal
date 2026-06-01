import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import styles from './SubscriptionGate.module.css';

// EUR prices (Nexa 3.0). Match server/constants/roles.js PLAN_PRICES.
const PRICES = {
  standard: { monthly: 19, quarterly: 49,  annual: 179 },
  admin_5:  { monthly: 39, quarterly: 99,  annual: 359 },
  admin_10: { monthly: 59, quarterly: 149, annual: 549 }
};
// Public-facing tier labels (Nexa 3.0).
const PLAN_LABEL = {
  standard: 'Основен',
  admin_5:  'Про',
  admin_10: 'Ултра'
};
// Short MK description per plan.
const PLAN_TOOLTIP = {
  standard: 'Сите алатки на Терминалот за индивидуална употреба.',
  admin_5:  'Терминалот + членство во Nexa мрежата. До 5 под-сметки за Вашите клиенти или тим.',
  admin_10: 'Терминалот + членство во Nexa мрежата · поголемо. До 10 под-сметки. Пристап до Topics Q&A авторска работна табла.'
};
const PLAN_SHORT = {
  standard: 'Индивидуално',
  admin_5:  'До 5 под-сметки',
  admin_10: 'До 10 под-сметки'
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
  const { token, currentUser, setCurrentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [blockedInfo, setBlockedInfo] = useState(null);
  const [cycle, setCycle] = useState('monthly');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('standard');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Company-details step (shown when companyInfo is incomplete at order time).
  const [step, setStep] = useState('order'); // 'order' | 'company'
  const [companyName,    setCompanyName]    = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyTax,     setCompanyTax]     = useState('');

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
    // Seed company-info fields from whatever is already on the user.
    const ci = currentUser?.companyInfo || {};
    setCompanyName(ci.companyName || '');
    setCompanyAddress(ci.companyAddress || '');
    setCompanyTax(ci.companyTaxNumber || '');
    setStep('order');
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

  const companyInfoMissing = () => {
    const ci = currentUser?.companyInfo || {};
    return !ci.companyName || !ci.companyAddress || !ci.companyTaxNumber;
  };

  /**
   * Step 1: Нарачај on the order screen. If buyer details are missing,
   * advance to the company-details step. Otherwise submit directly.
   */
  const onOrder = () => {
    if (!plan) return;
    if (!userHasEmail && (!email || !email.includes('@'))) {
      setError('Внесете валидна е-пошта за да испратиме инструкции за уплата.');
      return;
    }
    setError('');
    if (companyInfoMissing()) {
      setStep('company');
      return;
    }
    submitOrder();
  };

  /**
   * Step 2: persist company details (so future automated docs reuse them)
   * and then place the order.
   */
  const submitCompanyAndOrder = async () => {
    if (!companyName.trim() || !companyAddress.trim() || !companyTax.trim()) {
      setError('Внесете назив на компанија, адреса и даночен број.');
      return;
    }
    if (!/^\d{13}$/.test(companyTax.trim())) {
      setError('Даночниот број мора да содржи точно 13 цифри.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const ci = currentUser?.companyInfo || {};
      const payload = {
        companyInfo: {
          ...ci,
          companyName: companyName.trim(),
          companyAddress: companyAddress.trim(),
          companyTaxNumber: companyTax.trim()
        }
      };
      const res = await axios.put('/api/users/profile', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.user && setCurrentUser) setCurrentUser(res.data.user);
      await submitOrder();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setSubmitting(false);
    }
  };

  const submitOrder = async () => {
    setSubmitting(true);
    setError('');
    try {
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

  // Back-compat: anything still calling `submit()` keeps working.
  const submit = onOrder;

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
        ) : step === 'company' ? (
          <>
            <div className={styles.eyebrow}>Податоци за профактура</div>
            <h2 className={styles.title}>Внесете податоци за компанијата</h2>
            <p className={styles.lead}>
              Овие податоци ќе бидат отпечатени на профактурата и ќе се чуваат за идните
              автоматизирани документи и фактури.
            </p>

            <div className={styles.field}>
              <label>Назив на компанија *</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="ДОО ПРИМЕР Скопје"
              />
            </div>

            <div className={styles.field}>
              <label>Адреса на компанија *</label>
              <input
                type="text"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="ул. Македонија бр. 1, Скопје"
              />
            </div>

            <div className={styles.field}>
              <label>Даночен број (13 цифри) *</label>
              <input
                type="text"
                value={companyTax}
                onChange={(e) => setCompanyTax(e.target.value.replace(/\D/g, '').slice(0, 13))}
                placeholder="1234567890123"
                maxLength={13}
                inputMode="numeric"
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button
              type="button"
              className={styles.btnOrder}
              disabled={submitting}
              onClick={submitCompanyAndOrder}
            >
              <span className={styles.btnOrderLabel}>
                {submitting ? 'Се испраќа…' : 'Потврди и нарачај'}
              </span>
            </button>

            <div className={styles.bottomActions}>
              <button type="button" className={styles.btnText}
                      onClick={() => { setStep('order'); setError(''); }}>
                ← Назад
              </button>
            </div>
          </>
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

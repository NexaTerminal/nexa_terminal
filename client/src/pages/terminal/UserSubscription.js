import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import styles from './UserAccount.module.css';

const PLAN_LABEL = {
  standard: 'Nexa Платформа',
  admin_5:  'Nexa Мрежа · Кантора',
  admin_10: 'Nexa Мрежа · Студио'
};
const STATUS_LABEL = {
  trial:            'Пробен период',
  pending_approval: 'Чека одобрување',
  active:           'Активна',
  suspended:        'Суспендирана',
  cancelled:        'Откажана'
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
const daysUntil = (d) => {
  if (!d) return null;
  const n = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  return n;
};

export default function UserSubscriptionPage() {
  const { token, currentUser } = useAuth();
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    axios.get('/api/subscription/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!cancelled) setSub(res.data?.subscription || null); })
      .catch(e => { if (!cancelled) setErr(e.response?.data?.message || e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  const openGate = () => {
    try {
      window.dispatchEvent(new CustomEvent('subscription:blocked', {
        detail: { code: 'SUBSCRIPTION_USER_INITIATED', subscription: sub }
      }));
    } catch (_) { /* old browser */ }
  };

  const daysLeft = daysUntil(sub?.endsAt);
  const planLabel = PLAN_LABEL[sub?.plan] || (sub?.status === 'trial' ? PLAN_LABEL[currentUser?.intendedPlan] || 'Пробен' : '—');
  const isAdminRole = currentUser?.role === 'admin' || currentUser?.role === 'sub_seat';

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Сметка</span>
          <h1 className={styles.title}>Претплата</h1>
          <p className={styles.lead}>
            Преглед на Вашиот план и состојба. Можете да изберете нов план или
            да обновите постоен во секое време.
          </p>
        </header>

        {loading ? (
          <div className={styles.spinner}>Се вчитува…</div>
        ) : err ? (
          <div className={styles.toastError}>{err}</div>
        ) : !sub ? (
          <div className={styles.emptyState}>Нема податоци за претплата.</div>
        ) : (
          <>
            <section className={styles.panel}>
              <div className={styles.panelHead}>Активен план</div>
              <div className={styles.kv}>
                <div className={styles.kvK}>План</div>
                <div className={styles.kvV}><strong>{planLabel}</strong></div>

                <div className={styles.kvK}>Статус</div>
                <div className={styles.kvV}>
                  <span className={`${styles.statusPill} ${styles['s_' + (sub.status || 'unknown')]}`}>
                    {STATUS_LABEL[sub.status] || sub.status || '—'}
                  </span>
                </div>

                {sub.cycle && (
                  <>
                    <div className={styles.kvK}>Циклус</div>
                    <div className={styles.kvV}>
                      {sub.cycle === 'monthly' ? 'Месечно' :
                       sub.cycle === 'quarterly' ? 'Квартално' :
                       sub.cycle === 'annual' ? 'Годишно' : sub.cycle}
                    </div>
                  </>
                )}

                {sub.endsAt && (
                  <>
                    <div className={styles.kvK}>{sub.status === 'trial' ? 'Пробниот период завршува' : 'Истекува'}</div>
                    <div className={styles.kvV}>
                      {fmtDate(sub.endsAt)}
                      {daysLeft !== null && daysLeft >= 0 && (
                        <span className={styles.kvHint}> · {daysLeft === 0 ? 'денес' : `${daysLeft} ден(а)`}</span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {!isAdminRole && (
                <div className={styles.actionRow}>
                  <button type="button" className={styles.btnPrimary} onClick={openGate}>
                    {sub.status === 'trial' || sub.status === 'suspended'
                      ? 'Изберете план'
                      : 'Промени или обнови план'}
                  </button>
                </div>
              )}
              {currentUser?.role === 'sub_seat' && (
                <div className={styles.helpNote}>
                  Како поканет колега, пристапот Ви се обезбедува преку планот
                  на компанијата. За промени контактирајте го администраторот.
                </div>
              )}
            </section>

            {sub.graceEndsAt && new Date(sub.graceEndsAt) > new Date() && (
              <section className={styles.panel} style={{ borderColor: '#FCD34D', background: '#FFFBEB' }}>
                <div className={styles.panelHead} style={{ color: '#92400E' }}>Грејс период активен</div>
                <p style={{ fontSize: 13.5, color: '#92400E', margin: 0, lineHeight: 1.55 }}>
                  Имате дополнителен пристап до {fmtDate(sub.graceEndsAt)} додека
                  ја обработуваме уплатата. Активирањето е автоматско штом
                  пристигне уплатата.
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </TerminalShell>
  );
}

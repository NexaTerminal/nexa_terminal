import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import styles from './SubscriptionStatusBanner.module.css';

const daysRemaining = (d) => {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
};

const daysLabel = (n) => {
  if (n === 0) return 'денес';
  if (n === 1) return '1 ден';
  return `${n} денови`;
};

/**
 * Compact subscription indicator. Single-line slim strip at the top
 * of the terminal main area.
 *
 * Hidden when status is 'active' and >14 days remain.
 * Localised: Macedonian only (terminal is MK-only).
 *
 * CTAs stay INSIDE the terminal: clicking them dispatches the same
 * `subscription:blocked` window event that the 402 axios interceptor fires.
 * SubscriptionGate (mounted globally by PrivateRoute) catches it and opens
 * the in-terminal modal — same pre-invoice / 3-day grace flow. The user is
 * never navigated back to the public `/pricing` page.
 */
export default function SubscriptionStatusBanner() {
  const { token } = useAuth();
  const [sub, setSub] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const load = () => axios
      .get('/api/subscription/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!cancelled) { setSub(res.data.subscription); setLoaded(true); } })
      .catch(() => { if (!cancelled) setLoaded(true); });
    load();

    // Refresh after the gate modal succeeds, so the strip reflects new state.
    const onSuccess = () => load();
    window.addEventListener('subscription:updated', onSuccess);
    return () => {
      cancelled = true;
      window.removeEventListener('subscription:updated', onSuccess);
    };
  }, [token]);

  if (!loaded || !sub) return null;

  const status = sub.status;
  const days = daysRemaining(sub.endsAt);
  const graceDays = daysRemaining(sub.graceEndsAt);
  const graceActive = sub.graceEndsAt && new Date(sub.graceEndsAt) > new Date();

  if (status === 'active' && (days === null || days > 14) && !graceActive) return null;

  let variant = 'info', line = '', ctaLabel = null;

  if (graceActive) {
    variant = 'warn';
    line = `Гејс период — останува ${daysLabel(Math.max(0, graceDays))}. Извршете уплата за да го задржите пристапот.`;
    ctaLabel = 'Обнови';
  } else if (status === 'active' && days <= 14) {
    variant = days <= 3 ? 'warn' : 'info';
    line = days > 0
      ? `Претплатата истекува за ${daysLabel(days)}. Извршете уплата за следниот период.`
      : 'Претплатата истекува денес.';
    ctaLabel = 'Обнови';
  } else if (status === 'none') {
    variant = 'trial';
    line = 'Сметката не е активирана. Внесете код или изберете план за да започнете.';
    ctaLabel = 'Изберете план';
  } else if (status === 'pending_approval') {
    variant = 'info';
    line = 'Барањето за претплата чека одобрување. Активирањето е автоматско по потврда на уплатата.';
    // No CTA — informational only; user already submitted.
  } else if (status === 'suspended') {
    variant = 'danger';
    line = sub.graceUsed
      ? 'Сметката е суспендирана. Прво потврдете уплата за да добиете пристап.'
      : 'Сметката е суспендирана. Податоците се зачувани. Обновете за да продолжите.';
    ctaLabel = 'Обнови';
  } else if (status === 'cancelled') {
    variant = 'info';
    line = 'Претплатата е откажана. Можете да ја реактивирате во секое време.';
    ctaLabel = 'Реактивирај';
  } else {
    return null;
  }

  const openGate = () => {
    // Synthesize the same payload shape the 402 interceptor produces, so
    // SubscriptionGate doesn't need to know whether it was triggered by an
    // API failure or by the user clicking this strip.
    const detail = {
      code: 'SUBSCRIPTION_USER_INITIATED',
      message: line,
      subscription: {
        status: sub.status,
        endsAt: sub.endsAt,
        plan: sub.plan,
        cycle: sub.cycle,
        graceEndsAt: sub.graceEndsAt,
        graceUsed: sub.graceUsed
      }
    };
    try {
      window.dispatchEvent(new CustomEvent('subscription:blocked', { detail }));
    } catch (_) { /* old browser */ }
  };

  return (
    <div className={`${styles.strip} ${styles[variant]}`} role="status">
      <span className={styles.icon} aria-hidden>
        {variant === 'danger' ? '⚠' : variant === 'warn' ? '⏱' : 'ⓘ'}
      </span>
      <span className={styles.text}>{line}</span>
      {ctaLabel && (
        <button type="button" onClick={openGate} className={styles.link}>
          {ctaLabel} <span className={styles.arrow} aria-hidden>→</span>
        </button>
      )}
    </div>
  );
}

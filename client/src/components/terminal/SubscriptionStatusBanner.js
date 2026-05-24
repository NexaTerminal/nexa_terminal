import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './SubscriptionStatusBanner.module.css';

const daysRemaining = (d) => {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
};

// Macedonian day-noun grammar: 1 → ден, 2-4 → дена, 5+ → дена. We use "ден"/"денови".
const daysLabel = (n) => {
  if (n === 0) return 'денес';
  if (n === 1) return '1 ден';
  return `${n} денови`;
};

/**
 * Compact subscription/trial indicator. Renders a single-line slim strip
 * (~32px tall) at the top of the terminal main area. Different visual weight
 * from the profile-reminder card so the two don't compete.
 *
 * Hidden when status is 'active' and >14 days remain.
 * Localised: Macedonian only (terminal is MK-only).
 */
export default function SubscriptionStatusBanner() {
  const { token } = useAuth();
  const [sub, setSub] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    axios.get('/api/subscription/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!cancelled) { setSub(res.data.subscription); setLoaded(true); } })
      .catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [token]);

  if (!loaded || !sub) return null;

  const status = sub.status;
  const days = daysRemaining(sub.endsAt);
  const graceDays = daysRemaining(sub.graceEndsAt);
  const graceActive = sub.graceEndsAt && new Date(sub.graceEndsAt) > new Date();

  if (status === 'active' && (days === null || days > 14) && !graceActive) return null;

  // variant, line, cta
  let variant = 'info', line = '', cta = null;

  if (graceActive) {
    variant = 'warn';
    line = `Гејс период — останува ${daysLabel(Math.max(0, graceDays))}. Извршете уплата за да го задржите пристапот.`;
    cta = { to: '/pricing', label: 'Обнови' };
  } else if (status === 'trial') {
    variant = 'trial';
    line = days > 0
      ? `Пробен период — остануваат ${daysLabel(days)}. Изберете план за да го задржите пристапот.`
      : 'Пробниот период истекува денес.';
    cta = { to: '/pricing', label: 'Изберете план' };
  } else if (status === 'active' && days <= 14) {
    variant = days <= 3 ? 'warn' : 'info';
    line = days > 0
      ? `Претплатата истекува за ${daysLabel(days)}. Извршете уплата за следниот период.`
      : 'Претплатата истекува денес.';
    cta = { to: '/pricing', label: 'Обнови' };
  } else if (status === 'pending_approval') {
    variant = 'info';
    line = 'Барањето за претплата чека одобрување. Активирањето е автоматско по потврда на уплатата.';
  } else if (status === 'suspended') {
    variant = 'danger';
    line = sub.graceUsed
      ? 'Сметката е суспендирана. Прво потврдете уплата за да добиете пристап.'
      : 'Сметката е суспендирана. Податоците се зачувани. Обновете за да продолжите.';
    cta = { to: '/pricing', label: 'Обнови' };
  } else if (status === 'cancelled') {
    variant = 'info';
    line = 'Претплатата е откажана. Можете да ја реактивирате во секое време.';
    cta = { to: '/pricing', label: 'Реактивирај' };
  } else {
    return null;
  }

  return (
    <div className={`${styles.strip} ${styles[variant]}`} role="status">
      <span className={styles.icon} aria-hidden>
        {variant === 'danger' ? '⚠' : variant === 'warn' ? '⏱' : 'ⓘ'}
      </span>
      <span className={styles.text}>{line}</span>
      {cta && (
        <Link to={cta.to} className={styles.link}>
          {cta.label} <span className={styles.arrow} aria-hidden>→</span>
        </Link>
      )}
    </div>
  );
}

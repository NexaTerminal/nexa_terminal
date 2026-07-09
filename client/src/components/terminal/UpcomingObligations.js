import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { hasFeatureAccess } from '../../lib/tier';
import styles from './UpcomingObligations.module.css';

/**
 * „Претстојни обврски" — dashboard widget (cms-v1-plan.md M5).
 * Expiring contracts + pending obligations in the next 30 days.
 * Renders nothing for users without feature access or with an empty list.
 */
export default function UpcomingObligations() {
  const { currentUser, token } = useAuth();
  const [items, setItems] = useState(null);

  useEffect(() => {
    if (!token || !hasFeatureAccess(currentUser)) return;
    axios.get('/api/contracts/upcoming', {
      headers: { Authorization: `Bearer ${token}` },
      params: { days: 30 }
    })
      .then((res) => setItems(res.data.data || []))
      .catch(() => setItems([]));
  }, [token, currentUser]);

  if (!items || items.length === 0) return null;

  const daysLeft = (d) => Math.max(0, Math.ceil((new Date(d) - Date.now()) / 86400000));
  const urgency = (d) => {
    const n = daysLeft(d);
    if (n <= 3) return styles.urgent;
    if (n <= 10) return styles.soon;
    return '';
  };

  return (
    <section className={styles.widget}>
      <div className={styles.head}>
        <h2 className={styles.title}>Претстојни обврски</h2>
        <Link to="/terminal/contracts" className={styles.all}>Сите договори →</Link>
      </div>
      <ul className={styles.list}>
        {items.slice(0, 5).map((it, i) => (
          <li key={`${it.contractId}-${it.kind}-${i}`}>
            <Link to={`/terminal/contracts/${it.contractId}`} className={`${styles.item} ${urgency(it.dueAt)}`}>
              <span className={styles.itemLabel}>
                <strong>{it.title}</strong> — {it.label}
              </span>
              <span className={styles.itemDue}>
                {daysLeft(it.dueAt) === 0 ? 'денес' : `за ${daysLeft(it.dueAt)} ${daysLeft(it.dueAt) === 1 ? 'ден' : 'дена'}`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ApiService from '../../services/api';
import styles from './ClientSelector.module.css';

/**
 * Pro-only client picker shown at the top of a document flow. Lets a lawyer
 * generate on behalf of a saved client: selecting one sets `clientId` in the
 * form (the server rebuilds the company party from it) and prefills the company
 * fields for the live preview. "Мојата фирма" clears the override (uses the
 * lawyer's own companyInfo, i.e. the default behaviour).
 *
 * Renders nothing for non-Pro users, so Basic keeps its current experience.
 */
export default function ClientSelector({ value, onSelect }) {
  const [clients, setClients] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ApiService.get('/clients')
      .then(res => { if (!cancelled) setClients(res.items || []); })
      .catch(() => { /* non-Pro → 403; component simply shows the empty state */ })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  const handleChange = (e) => {
    const id = e.target.value;
    if (!id) { onSelect(null, null); return; }
    const c = clients.find(x => x._id === id) || null;
    onSelect(id, c);
  };

  if (!loaded) return null;

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>Документ за</span>
      {clients.length === 0 ? (
        <span className={styles.emptyRow}>
          <span className={styles.emptyText}>нема клиенти</span>
          <Link to="/terminal/clients" className={styles.addLink}>+ Додај</Link>
        </span>
      ) : (
        <>
          <select className={styles.select} value={value || ''} onChange={handleChange}>
            <option value="">Мојата фирма (стандардно)</option>
            {clients.map(c => (
              <option key={c._id} value={c._id}>{c.companyName}</option>
            ))}
          </select>
          <Link to="/terminal/clients" className={styles.manage}>Управувај</Link>
        </>
      )}
    </div>
  );
}

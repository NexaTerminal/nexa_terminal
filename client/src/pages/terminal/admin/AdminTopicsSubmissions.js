import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from '../Topics.module.css';

const STATUS_LABEL = {
  requested: 'Барање', in_progress: 'Во работа', submitted: 'Поднесено',
  returned: 'Вратено', accepted: 'Прифатено', published: 'Објавено',
  rejected: 'Одбиено', declined: 'Одбиено барање', released: 'Ослободено'
};
const fmt = (d) => d ? new Date(d).toLocaleString('mk-MK', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const FILTERS = [
  { v: '',          label: 'Сите активни' },
  { v: 'requested', label: 'Чекаат одобрување' },
  { v: 'submitted', label: 'За преглед' },
  { v: 'returned',  label: 'Вратени' },
  { v: 'accepted',  label: 'Прифатени (за објава)' },
  { v: 'published', label: 'Објавени' }
];

export default function AdminTopicsSubmissionsPage() {
  const { token } = useAuth();
  const [filter, setFilter] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/admin/topics/submissions${filter ? `?status=${filter}` : ''}`,
              { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setItems(res.data?.items || []))
      .catch(e => setToast({ type: 'error', text: e.response?.data?.message || e.message }))
      .finally(() => setLoading(false));
  }, [filter, token]);

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Admin · Topics</span>
          <h1 className={styles.title}>Поднесени Q&A</h1>
          <p className={styles.lead}>
            Прегледајте, одобрете, вратете или прифатете и објавете поднесени
            одговори на Студио членови.
          </p>
        </header>

        <nav className={styles.tabs}>
          {FILTERS.map(f => (
            <button key={f.v} type="button"
                    className={`${styles.tab} ${filter === f.v ? styles.tabActive : ''}`}
                    onClick={() => setFilter(f.v)}>
              {f.label}
            </button>
          ))}
        </nav>

        {toast && <div className={styles.toastError}>{toast.text}</div>}

        {loading ? (
          <div className={styles.spinner}>Се вчитува…</div>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>Нема поднесувања во оваа категорија.</div>
        ) : (
          <div className={styles.list}>
            {items.map(s => (
              <Link key={s._id} to={`/terminal/admin/topics/submissions/${s._id}`} className={styles.card}>
                <div className={styles.cardHead}>
                  <div className={styles.cardTitle}>Поднесување #{String(s._id).slice(-6)}</div>
                  <span className={`${styles.statusPill} ${styles['s_' + s.status]}`}>{STATUS_LABEL[s.status]}</span>
                </div>
                <div className={styles.cardScope}>{s.requestReason}</div>
                <div className={styles.cardMeta}>
                  <span>Барано: {fmt(s.requestedAt)}</span>
                  {s.submittedAt && <span>Поднесено: {fmt(s.submittedAt)}</span>}
                  {s.revisions?.length > 0 && <span>Доработки: {s.revisions.length}</span>}
                  <span>Одговори: {(s.answers || []).filter(a => a.text).length}/{(s.answers || []).length}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </TerminalShell>
  );
}

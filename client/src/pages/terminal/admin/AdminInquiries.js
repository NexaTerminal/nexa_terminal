import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from '../Inquiries.module.css';

const STATUS_LABEL = {
  open: 'Отворено', interest_received: 'Има интерес',
  partially_claimed: 'Делумно зафатено', claimed: 'Зафатено', closed: 'Затворено'
};
const CATEGORY_LABEL = {
  legal: 'Правен', accounting: 'Сметководство', tax: 'Даноци', insurance: 'Осигурување',
  real_estate: 'Недвижности', hr: 'HR', marketing: 'Маркетинг', translation: 'Превод', other: 'Друго'
};
const fmt = (d) => d ? new Date(d).toLocaleString('mk-MK', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const FILTERS = [
  { v: '',                  label: 'Сите' },
  { v: 'open',              label: 'Отворени' },
  { v: 'interest_received', label: 'Има интерес' },
  { v: 'partially_claimed', label: 'Делумно зафатени' },
  { v: 'claimed',           label: 'Зафатени' },
  { v: 'closed',            label: 'Затворени' }
];

export default function AdminInquiriesPage() {
  const { token } = useAuth();
  const [filter, setFilter] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/admin/inquiries${filter ? `?status=${filter}` : ''}`,
              { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setItems(res.data?.items || []))
      .catch(e => setErr(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [filter, token]);

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Admin · Барања</span>
          <h1 className={styles.title}>Управување со барања</h1>
          <p className={styles.lead}>
            Тука се прикажуваат сите барања што се внесени од сателитските
            сајтови. Кликнете на барање за да ги видите интересите и да
            одобрите член.
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
          <span style={{ flex: 1 }} />
          <Link to="/terminal/admin/inquiries/new" className={styles.btnPrimary} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            + Внеси ново барање
          </Link>
        </nav>

        {err && <div className={styles.toastError}>{err}</div>}
        {loading ? (
          <div className={styles.spinner}>Се вчитува…</div>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>Нема барања во оваа категорија.</div>
        ) : (
          <div className={styles.list}>
            {items.map(inq => (
              <Link key={inq._id} to={`/terminal/admin/inquiries/${inq._id}`} className={styles.card}>
                <div className={styles.cardHead}>
                  <div className={styles.cardTitle}>{inq.topic}</div>
                  {inq.urgency === 'urgent' && <span className={styles.chipUrgent}>Итно</span>}
                  <span className={`${styles.statusPill} ${styles['s_' + inq.status]}`}>
                    {STATUS_LABEL[inq.status]}
                  </span>
                </div>
                <div className={styles.cardSummary}>{inq.summary}</div>
                <div className={styles.chipsRow}>
                  {(inq.categories || []).map(c => (
                    <span key={c} className={styles.chip}>{CATEGORY_LABEL[c] || c}</span>
                  ))}
                </div>
                <div className={styles.cardMeta}>
                  <span>Извор: {inq.source}</span>
                  <span>Град: {inq.city}</span>
                  <span>Поднесено: {fmt(inq.postedAt)}</span>
                  <span>Одобрени: {(inq.approvals || []).length}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </TerminalShell>
  );
}

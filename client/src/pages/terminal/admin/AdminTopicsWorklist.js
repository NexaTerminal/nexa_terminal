import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from '../Topics.module.css';

const STATUS_LABEL = {
  open: 'Отворено', requested: 'Има барање', in_progress: 'Во работа',
  submitted: 'Поднесено', published: 'Објавено', archived: 'Архивирано'
};
const fmt = (d) => d ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const FILTERS = [
  { v: '',            label: 'Сите' },
  { v: 'open',        label: 'Отворени' },
  { v: 'requested',   label: 'Има барање' },
  { v: 'in_progress', label: 'Во работа' },
  { v: 'submitted',   label: 'Поднесени' },
  { v: 'published',   label: 'Објавени' },
  { v: 'archived',    label: 'Архивирани' }
];

export default function AdminTopicsWorklistPage() {
  const { token } = useAuth();
  const [filter, setFilter] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const refresh = () => {
    setLoading(true);
    axios.get(`/api/admin/topics/worklist${filter ? `?status=${filter}` : ''}`,
              { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setItems(res.data?.items || []))
      .catch(e => setToast({ type: 'error', text: e.response?.data?.message || e.message }))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const archive = async (id) => {
    if (!window.confirm('Архивирај ја темата?')) return;
    try {
      await axios.post(`/api/admin/topics/worklist/${id}/archive`, {},
                       { headers: { Authorization: `Bearer ${token}` } });
      refresh();
    } catch (e) { setToast({ type: 'error', text: e.response?.data?.message || e.message }); }
  };

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Admin · Topics</span>
          <h1 className={styles.title}>Работна листа на теми</h1>
          <p className={styles.lead}>
            10–15 активни теми во работа. Темите се видливи на табла на Студио
            членови додека не се поднесе барање за отворање.
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
          <Link to="/terminal/admin/topics/worklist/new" className={styles.btnPrimary} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            + Нова тема
          </Link>
        </nav>

        {toast && <div className={styles.toastError}>{toast.text}</div>}

        {loading ? (
          <div className={styles.spinner}>Се вчитува…</div>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>Нема теми во оваа категорија.</div>
        ) : (
          <div className={styles.list}>
            {items.map(t => (
              <div key={t._id} className={styles.card}>
                <div className={styles.cardHead}>
                  <div className={styles.cardTitle}>{t.title}</div>
                  <span className={styles.chip}>{t.practiceArea}</span>
                  <span className={`${styles.statusPill} ${styles['s_' + t.status]}`}>{STATUS_LABEL[t.status]}</span>
                </div>
                <div className={styles.cardScope}>{t.scope}</div>
                <div className={styles.cardMeta}>
                  <span>📝 {(t.questions || []).length} прашања</span>
                  <span>🎯 {t.targetKeyword || '—'}</span>
                  <span>Создадено: {fmt(t.createdAt)}</span>
                  {t.activeSubmissionId && <span>🔒 Заклучена</span>}
                </div>
                <div className={styles.cardRow}>
                  <span style={{ flex: 1 }} />
                  {t.status !== 'archived' && !t.activeSubmissionId && (
                    <button type="button" className={styles.btnGhost} onClick={() => archive(t._id)}>Архивирај</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TerminalShell>
  );
}

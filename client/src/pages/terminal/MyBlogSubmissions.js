import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import styles from './BlogSubmissions.module.css';

const STATUS_LABEL = {
  draft:       'Нацрт',
  ai_checking: 'AI проверка',
  submitted:   'Чека уреднички преглед',
  ai_passed:   'Чека уреднички преглед',   // legacy
  ai_failed:   'Чека уреднички преглед',   // legacy
  returned:    'Вратено за доработка',
  accepted:    'Прифатено',
  published:   'Објавено',
  rejected:    'Одбиено',
  archived:    'Архивирано'
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export default function MyBlogSubmissionsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    axios.get('/api/blogs/submissions', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!cancelled) setItems(res.data?.items || []); })
      .catch(e => { if (!cancelled) setErr(e.response?.data?.message || e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Блогови</span>
          <h1 className={styles.title}>Мои поднесувања</h1>
        </header>

        <nav className={styles.tabs}>
          <Link to="/terminal/blogs/submit"         className={styles.tab}>Поднеси прилог</Link>
          <Link to="/terminal/blogs/my-submissions" className={`${styles.tab} ${styles.tabActive}`}>Мои поднесувања</Link>
          <Link to="/terminal/blogs/published"      className={styles.tab}>Објавени</Link>
        </nav>

        {loading ? (
          <div className={styles.spinner}>Се вчитува…</div>
        ) : err ? (
          <div className={styles.toastError}>{err}</div>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>
            Сè уште нема нацрти. <Link to="/terminal/blogs/submit">Започнете прв прилог →</Link>
          </div>
        ) : (
          <div className={styles.list}>
            {items.map(s => (
              <Link key={s._id} to={`/terminal/blogs/submit?id=${s._id}`} className={styles.row}>
                <div className={styles.rowMain}>
                  <div className={styles.rowTitle}>{s.title || '(без наслов)'}</div>
                  <div className={styles.rowMeta}>
                    Последна промена: {fmt(s.updatedAt)}
                    {s.attemptsAi > 0 && ` · AI обиди: ${s.attemptsAi}/3`}
                    {s.newsletterMonth && ` · Билтен: ${s.newsletterMonth}`}
                  </div>
                </div>
                <span className={`${styles.statusPill} ${styles['s_' + s.status]}`}>
                  {STATUS_LABEL[s.status] || s.status}
                </span>
                <span style={{ color: '#94a3b8', fontSize: 18 }}>›</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </TerminalShell>
  );
}

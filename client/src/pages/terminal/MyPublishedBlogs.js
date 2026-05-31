import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import styles from './BlogSubmissions.module.css';

const fmt = (d) => d ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export default function MyPublishedBlogsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    axios.get('/api/blogs/submissions/published', { headers: { Authorization: `Bearer ${token}` } })
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
          <h1 className={styles.title}>Објавени</h1>
        </header>

        <nav className={styles.tabs}>
          <Link to="/terminal/blogs/submit"         className={styles.tab}>Поднеси прилог</Link>
          <Link to="/terminal/blogs/my-submissions" className={styles.tab}>Мои поднесувања</Link>
          <Link to="/terminal/blogs/published"      className={`${styles.tab} ${styles.tabActive}`}>Објавени</Link>
        </nav>

        {loading ? (
          <div className={styles.spinner}>Се вчитува…</div>
        ) : err ? (
          <div className={styles.toastError}>{err}</div>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>
            Сè уште нема објавени прилози. По уредничкото прифаќање, тука ќе ги видите.
          </div>
        ) : (
          <div className={styles.list}>
            {items.map(s => (
              <a key={s._id}
                 href={s.publishedBlogId ? `/blog/${s.publishedBlogId}` : `/terminal/blogs/submit?id=${s._id}`}
                 className={styles.row}
                 target={s.publishedBlogId ? '_blank' : undefined}
                 rel={s.publishedBlogId ? 'noopener' : undefined}>
                <div className={styles.rowMain}>
                  <div className={styles.rowTitle}>{s.title}</div>
                  <div className={styles.rowMeta}>
                    Објавено: {fmt(s.publishedAt)}
                    {s.newsletterMonth && ` · Билтен: ${s.newsletterMonth}`}
                  </div>
                </div>
                <span className={`${styles.statusPill} ${styles.s_published}`}>Објавено</span>
                <span style={{ color: '#94a3b8', fontSize: 18 }}>›</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </TerminalShell>
  );
}

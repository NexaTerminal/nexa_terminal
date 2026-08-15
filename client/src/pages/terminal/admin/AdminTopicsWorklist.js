import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import { TOPIC_CATEGORIES } from '../../../config/topicCategories';
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
  const [allItems, setAllItems] = useState([]);
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

  // Coverage overview counts are computed from ALL live (non-archived) topics,
  // independent of the status tab, so the gaps stay stable while filtering.
  useEffect(() => {
    axios.get('/api/admin/topics/worklist', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setAllItems(res.data?.items || []))
      .catch(() => { /* overview is best-effort */ });
  }, [token, items]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const t of allItems) {
      if (t.status === 'archived') continue;
      const c = t.category || '';
      counts[c] = (counts[c] || 0) + 1;
    }
    return counts;
  }, [allItems]);

  // Non-empty categories stored on topics that are no longer in the canonical
  // list (e.g. legacy „Договори"/„Шт" tags) — surfaced so they can be re-filed.
  const legacyCategories = useMemo(
    () => Object.keys(categoryCounts).filter(c => c && !TOPIC_CATEGORIES.includes(c)),
    [categoryCounts]
  );
  const uncategorized = categoryCounts[''] || 0;

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

        <div className={styles.field} style={{ marginBottom: 18 }}>
          <label className={styles.label}>Покриеност по категории</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TOPIC_CATEGORIES.map(c => {
              const n = categoryCounts[c] || 0;
              return (
                <Link
                  key={c}
                  to={`/terminal/admin/topics/worklist/new?category=${encodeURIComponent(c)}`}
                  className={styles.chip}
                  style={{
                    textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    borderStyle: n === 0 ? 'dashed' : 'solid'
                  }}
                  title={n === 0 ? 'Нема теми — додади нова' : `${n} теми`}
                >
                  {c} <b style={{ color: n === 0 ? '#b91c1c' : 'inherit' }}>({n})</b>
                </Link>
              );
            })}
            {legacyCategories.map(c => (
              <span key={c} className={styles.chip}
                    style={{ borderStyle: 'dashed', color: '#b45309' }}
                    title="Категорија надвор од стандардните — уредете ги темите за да ги префрлите">
                {c} ({categoryCounts[c]}) ⚠
              </span>
            ))}
            {uncategorized > 0 && (
              <span className={styles.chip}
                    style={{ borderStyle: 'dashed', color: '#b91c1c' }}
                    title="Теми без категорија — доделете им категорија преку „Уреди“">
                Без категорија ({uncategorized})
              </span>
            )}
          </div>
          <span className={styles.help}>Кликни на категорија за да додадеш нова тема во неа. Црвените (0) се непокриени; ⚠ се нестандардни категории.</span>
        </div>

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
                  {t.category
                    ? <span className={styles.chip}>{t.category}</span>
                    : <span className={styles.chip} style={{ borderStyle: 'dashed', color: '#b91c1c' }}>Без категорија</span>}
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
                  {t.status !== 'archived' && (
                    <Link to={`/terminal/admin/topics/worklist/${t._id}/edit`} className={styles.btnSecondary} style={{ textDecoration: 'none' }}>
                      Уреди
                    </Link>
                  )}
                  <Link to="/terminal/admin/topics/worklist/new" state={{ from: t }} className={styles.btnGhost} style={{ textDecoration: 'none' }}>
                    Копирај
                  </Link>
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

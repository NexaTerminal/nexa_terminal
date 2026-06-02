import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import { canSubmitBlog, openSubscriptionGate } from '../../lib/tier';
import styles from './BlogSubmissions.module.css';

/* Status taxonomy on the server has a few legacy values from the old AI flow;
   we collapse them into 4 user-facing buckets that mirror the Случаи pills. */
const STATE_BY_STATUS = {
  draft:       { key: 'draft',     label: 'Нацрт',                  cls: 's_draft' },
  submitted:   { key: 'submitted', label: 'Чека уреднички преглед', cls: 's_submitted' },
  ai_checking: { key: 'submitted', label: 'Чека уреднички преглед', cls: 's_submitted' },
  ai_passed:   { key: 'submitted', label: 'Чека уреднички преглед', cls: 's_submitted' },
  ai_failed:   { key: 'submitted', label: 'Чека уреднички преглед', cls: 's_submitted' },
  accepted:    { key: 'accepted',  label: 'Прифатено',              cls: 's_accepted' },
  published:   { key: 'published', label: 'Објавено',               cls: 's_published' },
  returned:    { key: 'returned',  label: 'Вратено за доработка',   cls: 's_returned' },
  rejected:    { key: 'rejected',  label: 'Одбиено',                cls: 's_rejected' },
  archived:    { key: 'archived',  label: 'Архивирано',             cls: 's_archived' }
};
const STATE_FALLBACK = { key: 'unknown', label: '—', cls: 's_draft' };

const STATE_ORDER = { returned: 0, draft: 1, submitted: 2, accepted: 3, published: 4, rejected: 5, archived: 6, unknown: 9 };

const fmt = (d) => d ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const stripHtml = (html = '') => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export default function BlogsPage() {
  const { token, currentUser } = useAuth();
  const navigate = useNavigate();
  const canSubmit = canSubmitBlog(currentUser);
  const handleNewBlog = (e) => {
    if (canSubmit.allowed) return; // let the <Link> navigate
    e?.preventDefault();
    openSubscriptionGate({ source: 'blogs/submit' });
  };
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const [submissions, setSubmissions] = useState([]);
  const [published, setPublished] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      axios.get('/api/blogs/submissions',           auth).then(r => r.data?.items || []).catch(() => []),
      axios.get('/api/blogs/submissions/published', auth).then(r => r.data?.items || []).catch(() => [])
    ]).then(([subs, pub]) => {
      if (cancelled) return;
      setSubmissions(subs); setPublished(pub);
    }).catch(e => { if (!cancelled) setErr(e.response?.data?.message || e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = useMemo(() => {
    const byId = new Map();
    submissions.forEach(s => byId.set(String(s._id), s));
    published.forEach(p => {
      // Published rows replace any non-published version (they carry publishedAt + publishedBlogId).
      byId.set(String(p._id), { ...byId.get(String(p._id)), ...p, status: p.status || 'published' });
    });
    const list = Array.from(byId.values()).map(s => ({
      ...s,
      state: STATE_BY_STATUS[s.status] || STATE_FALLBACK
    }));
    list.sort((a, b) => {
      const oa = STATE_ORDER[a.state.key] ?? 9, ob = STATE_ORDER[b.state.key] ?? 9;
      if (oa !== ob) return oa - ob;
      const da = new Date(a.publishedAt || a.updatedAt || a.createdAt || 0).getTime();
      const db = new Date(b.publishedAt || b.updatedAt || b.createdAt || 0).getTime();
      return db - da;
    });
    return list;
  }, [submissions, published]);

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <span className={styles.eyebrow}>Објави блог</span>
            <Link to="/terminal/blogs/submit" className={styles.btnPrimary} onClick={handleNewBlog}>
              + Напиши прилог
            </Link>
          </div>

          <div className={styles.commercialNote}>
            <div className={styles.commercialNoteIcon} aria-hidden>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20h4l10-10-4-4L4 16z"/>
                <path d="M14 6l4 4"/>
              </svg>
            </div>
            <div className={styles.commercialNoteBody}>
              <p className={styles.commercialNoteText}>
                Напишете експертски прилог од Вашата практика. По
                поднесување, уредничкиот тим прави рачен преглед —
                ако се потребни измени, Ве контактираме на е-пошта;
                ако сè е во ред, прилогот се објавува под Ваше име на
                јавниот Nexa блог. Така ја градите личната и
                професионалната видливост, а читателите се клиенти
                кои бараат специјалист.
              </p>
              <div className={styles.commercialSources}>
                <span className={styles.commercialSourcesLabel}>Каде се објавува:</span>
                <a href="https://nexa.mk/blog" target="_blank" rel="noopener noreferrer" className={styles.commercialSourceLink}>nexa.mk/blog</a>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className={styles.spinner}>Се вчитува…</div>
        ) : err ? (
          <div className={styles.toastError}>{err}</div>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>
            Сè уште нема прилози. <Link to="/terminal/blogs/submit" onClick={handleNewBlog}>Започнете прв прилог →</Link>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {items.map(s => (
              <BlogCard key={s._id} item={s} onOpen={() => setDetail(s)} />
            ))}
          </div>
        )}

        {detail && (
          <BlogDetailModal
            item={detail}
            onClose={() => setDetail(null)}
            onEdit={() => navigate(`/terminal/blogs/submit?id=${detail._id}`)}
          />
        )}
      </div>
    </TerminalShell>
  );
}

function BlogCard({ item, onOpen }) {
  const excerpt = stripHtml(item.bodyHtml || '').slice(0, 220);
  return (
    <div className={styles.cardGridItem}>
      <div className={styles.cardHead}>
        <span className={`${styles.statusPill} ${styles[item.state.cls]}`}>{item.state.label}</span>
      </div>
      <div className={styles.cardTitle}>{item.title || '(без наслов)'}</div>
      {excerpt && <div className={styles.cardSummaryClamp}>{excerpt}</div>}
      <button type="button" className={styles.readMoreLink} onClick={onOpen}>
        Прочитај повеќе →
      </button>
      <div className={styles.cardMeta}>
        {item.publishedAt
          ? <span className={styles.cardMetaItem}>📅 Објавено: {fmt(item.publishedAt)}</span>
          : item.updatedAt && <span className={styles.cardMetaItem}>✎ Изменето: {fmt(item.updatedAt)}</span>}
      </div>
    </div>
  );
}

function BlogDetailModal({ item, onClose, onEdit }) {
  const editable = ['draft', 'returned'].includes(item.state.key);
  const onPublicBlog = item.state.key === 'published' && item.publishedBlogId;
  const fullText = stripHtml(item.bodyHtml || '');

  return (
    <div className={styles.detailBackdrop} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.detailClose} onClick={onClose} aria-label="Затвори">×</button>

        <div style={{ marginBottom: 8 }}>
          <span className={`${styles.statusPill} ${styles[item.state.cls]}`}>{item.state.label}</span>
        </div>
        <h2 className={styles.detailTitle}>{item.title || '(без наслов)'}</h2>

        <div className={styles.detailMeta}>
          {item.publishedAt && <span>📅 Објавено: {fmt(item.publishedAt)}</span>}
          {item.updatedAt   && <span>✎ Изменето: {fmt(item.updatedAt)}</span>}
          {item.createdAt   && <span>Креирано: {fmt(item.createdAt)}</span>}
        </div>

        {item.state.key === 'returned' && item.editorialNotes && (
          <div className={styles.editorialNotes} style={{ margin: '0 0 14px' }}>
            <strong>Белешки од уредникот:</strong>
            <div>{item.editorialNotes}</div>
          </div>
        )}

        {fullText && <p className={styles.detailSummary}>{fullText}</p>}

        <div className={styles.detailActions}>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>Затвори</button>
          {editable && (
            <button type="button" className={styles.btnPrimary} onClick={onEdit}>Уреди прилог</button>
          )}
          {onPublicBlog && (
            <a className={styles.btnPrimary} href={`/blog/${item.publishedBlogId}`} target="_blank" rel="noopener noreferrer">
              Види на јавниот блог →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

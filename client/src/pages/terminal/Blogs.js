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

// Line-style icons (no emojis) — match the existing commercialNote SVG style.
const svgProps = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const IconWrite = () => (<svg {...svgProps}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>);
const IconReview = () => (<svg {...svgProps}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1" /><path d="M8.5 13l2 2 4.5-4.5" /></svg>);
const IconPublish = () => (<svg {...svgProps}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" /></svg>);
const IconGrowth = () => (<svg {...svgProps}><path d="M3 17l6-6 4 4 7-7" /><path d="M17 7h4v4" /></svg>);

// Decorative illustration of a published article (no asset files needed).
const BlogArt = () => (
  <svg viewBox="0 0 320 240" role="img" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="308" height="228" rx="18" fill="#F1F5FE" />
    {/* article card */}
    <rect x="58" y="36" width="204" height="172" rx="12" fill="#ffffff" stroke="#E1E8F5" />
    <path d="M58 48a12 12 0 0 1 12-12h180a12 12 0 0 1 12 12v26H58z" fill="#1e4db7" />
    <rect x="76" y="48" width="120" height="6" rx="3" fill="#ffffff" opacity="0.95" />
    <rect x="76" y="60" width="74" height="5" rx="2.5" fill="#ffffff" opacity="0.6" />
    <rect x="78" y="94" width="164" height="6" rx="3" fill="#c7d2e6" />
    <rect x="78" y="108" width="150" height="6" rx="3" fill="#dbe3f0" />
    <rect x="78" y="122" width="160" height="6" rx="3" fill="#dbe3f0" />
    <rect x="78" y="136" width="116" height="6" rx="3" fill="#dbe3f0" />
    {/* author chip */}
    <circle cx="92" cy="178" r="13" fill="#e8edf9" />
    <circle cx="92" cy="174" r="4.5" fill="#1e4db7" />
    <path d="M84 187c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5" fill="#1e4db7" />
    <rect x="112" y="172" width="84" height="6" rx="3" fill="#0B1220" />
    <rect x="112" y="184" width="56" height="5" rx="2.5" fill="#c7d2e6" />
    {/* floating "Објавено" badge */}
    <rect x="196" y="22" width="96" height="30" rx="15" fill="#ffffff" stroke="#E1E8F5" />
    <circle cx="214" cy="37" r="8" fill="#16a34a" />
    <path d="M210.5 37l2.4 2.4 4.1-4.6" stroke="#fff" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="228" y="34" width="52" height="6" rx="3" fill="#c7d2e6" />
    {/* floating topic tag */}
    <rect x="22" y="198" width="74" height="28" rx="14" fill="#ffffff" stroke="#E1E8F5" />
    <circle cx="39" cy="212" r="4.5" fill="#f59e0b" />
    <rect x="51" y="209" width="36" height="6" rx="3" fill="#c7d2e6" />
  </svg>
);

const Feature = ({ icon, title, text }) => (
  <div className={styles.blogFeature}>
    <div className={styles.blogFeatureIcon} aria-hidden>{icon}</div>
    <h3 className={styles.blogFeatureTitle}>{title}</h3>
    <p className={styles.blogFeatureText}>{text}</p>
  </div>
);

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

          <section className={styles.blogHero}>
            <div className={styles.blogHeroText}>
              <h1 className={styles.blogHeroTitle}>Експертски прилози</h1>
              <p className={styles.blogHeroLead}>
                Споделете практично знаење од Вашата област и објавете го под Ваше
                име на јавниот Nexa блог. Така градите професионален авторитет и личен
                бренд, а читателите се деловни луѓе кои токму бараат специјалист како Вас.
              </p>
              <div className={styles.blogTopics}>
                <span className={styles.blogTopicsLabel}>Дозволени теми:</span>
                {['Деловни', 'Правни', 'Маркетинг', 'Капитал'].map(t => (
                  <span key={t} className={styles.blogTopicTag}>{t}</span>
                ))}
              </div>
              <a href="https://nexa.mk/blog" target="_blank" rel="noopener noreferrer" className={styles.blogHeroLink}>
                Погледни ги објавените прилози →
              </a>
            </div>
            <div className={styles.blogHeroArt} aria-hidden="true"><BlogArt /></div>
          </section>

          <div className={styles.blogFeatureGrid}>
            <Feature icon={<IconWrite />} title="Пишувате од Вашата експертиза"
              text="Практични увиди од Вашата секојдневна работа — не академски трактати, туку корисно знаење за деловните луѓе." />
            <Feature icon={<IconReview />} title="Уреднички преглед"
              text="Секој прилог поминува рачен уреднички преглед. Ако се потребни измени, Ве контактираме на е-пошта; ако сè е во ред, се објавува." />
            <Feature icon={<IconPublish />} title="Објавено под Ваше име"
              text="Прилогот излегува на nexa.mk/blog со Вашето име и фотографија — Вие сте препознатливиот автор." />
            <Feature icon={<IconGrowth />} title="Видливост и нови клиенти"
              text="Градите авторитет и личен бренд. Читателите се потенцијални клиенти кои бараат специјалист за својата потреба." />
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

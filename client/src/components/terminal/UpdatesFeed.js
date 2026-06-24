import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';
import { visibleTier } from '../../lib/tier';
import UpdateModal from './UpdateModal';
import styles from '../../styles/terminal/UpdatesFeed.module.css';

const PREVIEW_WORDS = 50;

// Truncate body to N words for the card; flag whether there's more to read.
const previewBody = (text = '', n = PREVIEW_WORDS) => {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (words.length <= n) return { text, truncated: false };
  return { text: words.slice(0, n).join(' ') + '…', truncated: true };
};

/**
 * Terminal Dashboard feed.
 *
 * Top: quick-action shortcuts + (tier B/C) summary tiles — navigation value.
 * Below: "Updates / Известувања" — admin-authored, dated notices that are
 * member-only (regulatory changes, deadlines, do-this-now nudges with a CTA
 * that links into the product). This is NOT the public blog; blogs live only
 * on the public site now.
 */

const TEMPLATE_SHORTCUTS = [
  { to: '/terminal/documents/employment/employment-agreement',  label: 'Договор за вработување' },
  { to: '/terminal/documents/employment/termination-agreement', label: 'Спогодба за престанок' },
  { to: '/terminal/documents/employment/annual-leave-decision', label: 'Одлука за годишен одмор' }
];

const SCREENING_SHORTCUTS = [
  { to: '/terminal/legal-screening',     label: 'Правна проверка' },
  { to: '/terminal/hr-screening',        label: 'HR и оперативна' },
  { to: '/terminal/marketing-screening', label: 'Маркетинг проверка' }
];

const AI_SHORTCUTS = [
  { to: '/terminal/ai-chat',           label: 'Правен AI помошник' },
  { to: '/terminal/contract-analysis', label: 'Анализа на договор' },
  { to: '/terminal/marketing-ai',      label: 'Маркетинг AI' }
];

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' })
  : '';

// ─────────────────────────────────────────────────────────────────────────────

const UpdatesFeed = () => {
  const { token, currentUser } = useAuth();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await ApiService.request('/updates?limit=10');
        if (!cancelled) setUpdates(data?.items || []);
      } catch (err) {
        if (!cancelled) { setError('Настана грешка при вчитување на известувањата.'); setUpdates([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const [openId, setOpenId] = useState(null);

  // Sync a single card after a like/comment in the modal (or inline like).
  const patchItem = useCallback((id, patch) => {
    setUpdates(prev => prev.map(u => (u._id === id ? { ...u, ...patch } : u)));
  }, []);

  const tier = visibleTier(currentUser);
  const showBcTiles = tier === 'B' || tier === 'C';
  const openItem = updates.find(u => u._id === openId) || null;

  return (
    <div className={styles.socialFeed}>
      {error && <div className={styles.feedError}>{error}</div>}

      <div className={styles.feedStream}>
        {showBcTiles && <BcTileRow tier={tier} />}
        <ActionGridCard />

        <div className={styles.sectionBreak} role="separator" aria-hidden="true">
          <span className={styles.sectionBreakLabel}>Известувања</span>
        </div>

        {loading && updates.length === 0 && (
          <div className={styles.feedLoading}>Се вчитува…</div>
        )}

        {!loading && updates.length === 0 && (
          <div className={styles.topicEmpty}>Сè уште нема известувања.</div>
        )}

        {updates.map(u => (
          <UpdateCard key={u._id} update={u} onOpen={() => setOpenId(u._id)} onPatch={patchItem} />
        ))}
      </div>

      {openItem && (
        <UpdateModal seed={openItem} onClose={() => setOpenId(null)} onPatch={patchItem} />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const ShortcutColumn = ({ title, items, allTo }) => (
  <div className={styles.shortcutCol}>
    <div className={styles.shortcutColTitle}>{title}</div>
    <ul className={styles.shortcutList}>
      {items.map(s => (
        <li key={s.to}>
          <Link to={s.to} className={styles.shortcutLink}>{s.label}</Link>
        </li>
      ))}
      {allTo && (
        <li>
          <Link to={allTo} className={`${styles.shortcutLink} ${styles.shortcutLinkAll}`}>Сите</Link>
        </li>
      )}
    </ul>
  </div>
);

const ActionGridCard = () => (
  <section className={styles.actionCard} aria-label="Брзи дејства">
    <header className={styles.actionHeader}>
      <span className={styles.eyebrow}>
        <span className={`${styles.eyebrowDot} ${styles.dotBlue}`} aria-hidden />
        Брзи дејства
      </span>
    </header>
    <div className={styles.shortcutCols}>
      <ShortcutColumn title="Шаблони"   items={TEMPLATE_SHORTCUTS}  allTo="/terminal/documents" />
      <ShortcutColumn title="Проверки"  items={SCREENING_SHORTCUTS} allTo="/terminal/legal-screening" />
      <ShortcutColumn title="AI алатки" items={AI_SHORTCUTS}        allTo="/terminal/ai-chat" />
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────────────────────

const UpdateCard = ({ update, onOpen, onPatch }) => {
  const { text: preview, truncated } = previewBody(update.body);

  const toggleLike = async (e) => {
    e.stopPropagation();
    try {
      const r = await ApiService.post(`/updates/${update._id}/like`);
      onPatch(update._id, { likesCount: r.likesCount, likedByMe: r.likedByMe });
    } catch { /* ignore */ }
  };

  return (
    <article className={styles.blogPost}>
      <div className={styles.blogPostContent}>
        <div className={styles.blogPostMeta}>
          {update.category
            ? <span className={styles.updateCategory}>{update.category}</span>
            : <span />}
          <span className={styles.blogPostTime}>{fmtDate(update.publishedAt || update.createdAt)}</span>
        </div>
        <h3 className={styles.blogPostTitle}>{update.title}</h3>
        {update.body && <p className={styles.updateBody}>{preview}</p>}

        <div className={styles.updateFooter}>
          {truncated && (
            <button type="button" className={styles.readMoreBtn} onClick={onOpen}>Прочитај повеќе</button>
          )}
          <span className={styles.engageSpacer} />
          <button
            type="button"
            className={`${styles.engageBtn} ${update.likedByMe ? styles.engageBtnActive : ''}`}
            onClick={toggleLike}
            title="Ми се допаѓа"
          >
            <span className={styles.engageIcon}>{update.likedByMe ? '♥' : '♡'}</span>
            <span>{update.likesCount || 0}</span>
          </button>
          <button type="button" className={styles.engageBtn} onClick={onOpen} title="Коментари">
            <span className={styles.engageIcon}>💬</span>
            <span>{update.commentsCount || 0}</span>
          </button>
        </div>
      </div>
    </article>
  );
};

// ─── Tier B / C dashboard tiles ────────────────────────────────────────
const BcTileRow = ({ tier }) => {
  const { token } = useAuth();
  const [inquiriesWeek, setInquiriesWeek] = useState(null);
  const [topicsOpen,    setTopicsOpen]    = useState(null);
  const [blogsMine,     setBlogsMine]     = useState(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const auth = { headers: { Authorization: `Bearer ${token}` } };
    const weekAgo = Date.now() - 7 * 86400000;

    // Inquiries — count visible items published in the last 7 days.
    fetch('/api/inquiries', auth)
      .then(r => r.ok ? r.json() : { items: [] })
      .then(data => {
        if (cancelled) return;
        const items = data?.items || [];
        const recent = items.filter(i => {
          const ts = new Date(i.publishedAt || i.createdAt || 0).getTime();
          return ts >= weekAgo;
        });
        setInquiriesWeek(recent.length);
      })
      .catch(() => !cancelled && setInquiriesWeek(0));

    // Topics worklist (only tier C sees this tile).
    if (tier === 'C') {
      fetch('/api/topics/worklist', auth)
        .then(r => r.ok ? r.json() : { items: [] })
        .then(data => !cancelled && setTopicsOpen((data?.items || []).length))
        .catch(() => !cancelled && setTopicsOpen(0));
    }

    // User's own published blog count.
    fetch('/api/blogs/submissions/published', auth)
      .then(r => r.ok ? r.json() : { items: [] })
      .then(data => !cancelled && setBlogsMine((data?.items || []).length))
      .catch(() => !cancelled && setBlogsMine(0));

    return () => { cancelled = true; };
  }, [token, tier]);

  const showValue = (n) => (n === null ? '…' : n);

  return (
    <section className={styles.bcTileRow} aria-label="Преглед">
      <Link to="/terminal/leads" className={styles.bcTile}>
        <div className={styles.bcTileLabel}>Барања оваа недела</div>
        <div className={styles.bcTileValue}>{showValue(inquiriesWeek)}</div>
        <div className={styles.bcTileSub}>нови во Вашата област</div>
      </Link>
      {tier === 'C' && (
        <Link to="/terminal/topics-qa" className={styles.bcTile}>
          <div className={styles.bcTileLabel}>Прашања на чекање</div>
          <div className={styles.bcTileValue}>{showValue(topicsOpen)}</div>
          <div className={styles.bcTileSub}>отворени за одговор</div>
        </Link>
      )}
      <Link to="/terminal/blogs" className={styles.bcTile}>
        <div className={styles.bcTileLabel}>Ваши објави</div>
        <div className={styles.bcTileValue}>{blogsMine === null ? '…' : (blogsMine || '—')}</div>
        <div className={styles.bcTileSub}>
          {blogsMine ? 'објавени прилози' : 'поднесете прв прилог →'}
        </div>
      </Link>
    </section>
  );
};

export default UpdatesFeed;

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';
import FeedPost from '../posts/FeedPost';
import { visibleTier } from '../../lib/tier';
import { AI_AGENTS, getAgent } from '../../config/aiAgents';
import AgentName from '../chatbot/AgentName';
import { useChatDock } from '../../contexts/ChatDockContext';
import UpdateModal from './UpdateModal';
import FeedAuthor, { askAboutPost } from './FeedAuthor';
import profileStyles from '../../styles/terminal/CompanyProfile.module.css';
import { resolveBlogImage } from '../../utils/blogImage';
import styles from '../../styles/terminal/UpdatesFeed.module.css';

const PREVIEW_WORDS = 50;
const getAgentName = (k) => getAgent(k)?.name || '';

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
 * that links into the product). Latest public blog articles are interleaved
 * with the notices by date; each opens /blog/<slug> in a new tab, where the logged-in
 * member sees the full (members-only) article.
 */

const BLOG_LIMIT = 10;

const stripHtml = (html = '') => String(html).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// One stream of notices and articles, newest first.
const mergeByDate = (updates, blogs, posts = []) => [
  ...updates.map(item => ({ kind: 'update', item, ts: new Date(item.publishedAt || item.createdAt || 0).getTime() })),
  ...posts.map(item => ({ kind: 'post', item, ts: new Date(item.createdAt || 0).getTime() })),
  ...blogs.map(item => ({ kind: 'blog', item, ts: new Date(item.createdAt || 0).getTime() })),
].sort((a, b) => b.ts - a.ts);

// Suggested actions — benefit-driven tiles that nudge feature discovery.
// `icon` keys into ICONS; `accent` tints the icon wrap and hover border.
const SUGGESTED_ACTIONS = [
  { to: '/terminal/documents',          title: 'Нов документ',       desc: 'Договори, одлуки и спогодби за минута',  icon: 'doc',       accent: 'blue'   },
  { to: '/terminal/legal-screening',    title: 'Правна проверка',    desc: 'Откриј каде си изложен на правен ризик', icon: 'shield',    accent: 'teal'   },
  { to: '/terminal/hr-screening',       title: 'HR и оперативна',    desc: 'Усогласи ги работните односи',          icon: 'users',     accent: 'amber'  },
  { to: '/terminal/contract-analysis',  title: 'Анализа на договор', desc: 'AI ги наоѓа ризичните клаузули',        icon: 'contract',  accent: 'indigo' },
  { to: '/terminal/marketing-screening', title: 'Маркетинг проверка', desc: 'Провери усогласеност во маркетингот',  icon: 'megaphone', accent: 'rose'   },
  { to: '/terminal/marketing-ai',       title: 'Маркетинг AI',       desc: 'Идеи за содржина и кампањи',             icon: 'spark',     accent: 'rose'   },
];

// Direct jump-to links for users who already know the template they need.
const TEMPLATE_SHORTCUTS = [
  { to: '/terminal/documents/employment/employment-agreement',  label: 'Договор за вработување' },
  { to: '/terminal/documents/employment/termination-agreement', label: 'Спогодба за престанок' },
  { to: '/terminal/documents/employment/annual-leave-decision', label: 'Одлука за годишен одмор' },
];

// Active characters only — the hero avatar band that opens the chat dock.
const AI_CHARACTERS = AI_AGENTS.filter((a) => !a.comingSoon);

// Compact inline icon set for the shortcut pills.
const ICONS = {
  doc: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" />,
  shield: <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />,
  users: <path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M22 20v-2a4 4 0 0 0-3-3.87 M16 4.13A4 4 0 0 1 16 11" />,
  megaphone: <path d="M3 11l15-6v14l-15-6z M3 11v4a2 2 0 0 0 2 2h1 M14 7v10" />,
  contract: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 15l2 2 4-4" />,
  spark: <path d="M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5 18 18 M18 6l-2.5 2.5 M8.5 15.5 6 18" />,
};

const Icon = ({ name }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

const ArrowIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14 M13 6l6 6-6 6" />
  </svg>
);

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' })
  : '';

// ─────────────────────────────────────────────────────────────────────────────

const UpdatesFeed = () => {
  const { token, currentUser } = useAuth();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [posts, setPosts] = useState([]);

  // Company posts (Објави) — structured, from the network; newest first.
  useEffect(() => {
    let cancelled = false;
    ApiService.request('/company-posts/feed?limit=20')
      .then(data => { if (!cancelled) setPosts(data?.items || []); })
      .catch(() => { /* feed works without posts */ });
    return () => { cancelled = true; };
  }, [token]);
  const patchPost = useCallback((id, next) => {
    setPosts(prev => (next ? prev.map(p => (p._id === id ? next : p)) : prev.filter(p => p._id !== id)));
  }, []);

  // Public list endpoint (excerpts only); newest first.
  useEffect(() => {
    let cancelled = false;
    ApiService.get('/blog')
      .then(data => { if (!cancelled) setBlogs(Array.isArray(data) ? data.slice(0, BLOG_LIMIT) : []); })
      .catch(() => { /* feed still works without articles */ });
    return () => { cancelled = true; };
  }, []);

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
  const showBcTiles = tier === 'B';
  const openItem = updates.find(u => u._id === openId) || null;

  return (
    <div className={styles.socialFeed}>
      {error && <div className={styles.feedError}>{error}</div>}

      <div className={styles.feedStream}>
        <AiTeamBand />
        <ProfileSuggestion />
        {showBcTiles && <BcTileRow tier={tier} />}
        <ActionGridCard />

        <div className={styles.sectionBreak} role="separator" aria-hidden="true">
          <span className={styles.sectionBreakLabel}>Од мрежата: објави, известувања и статии</span>
        </div>

        {loading && updates.length === 0 && (
          <div className={styles.feedLoading}>Се вчитува…</div>
        )}

        <a href="/terminal/objavi" className={styles.postCta}>+ Објавете понуда, барање или новост од Вашата фирма</a>

        {!loading && updates.length === 0 && blogs.length === 0 && posts.length === 0 && (
          <div className={styles.topicEmpty}>Сè уште нема известувања.</div>
        )}

        {mergeByDate(updates, blogs, posts).map(({ kind, item }) => (kind === 'update'
          ? <UpdateCard key={item._id} update={item} onOpen={() => setOpenId(item._id)} onPatch={patchItem} />
          : kind === 'post'
            ? <FeedPost key={`post-${item._id}`} post={item} onChange={(next) => patchPost(item._id, next)} />
            : <BlogCard key={`blog-${item._id}`} post={item} />
        ))}

        {blogs.length > 0 && (
          <a href="/blog" target="_blank" rel="noopener noreferrer" className={styles.feedAllBlogs}>
            Сите статии на блогот <ArrowIcon />
          </a>
        )}
      </div>

      {openItem && (
        <UpdateModal seed={openItem} onClose={() => setOpenId(null)} onPatch={patchItem} />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

// Hero band: the AI team is the star feature, so it leads the dashboard. Tap a
// character avatar to open the chat dock; "Сите" links to the full AI Team page.
const AiTeamBand = () => {
  const { openChat } = useChatDock();
  const { currentUser } = useAuth();
  const company = currentUser?.companyInfo?.companyName?.trim();
  return (
    <div className={styles.aiBand}>
      <div className={styles.aiBandHero}>
        <div className={styles.aiBandHeroText}>
          <h2 className={styles.aiBandTitle}>{company ? `Тимот на ${company} е тука` : 'Твојот тим е тука'}</h2>
        </div>
        <Link to="/terminal/ai-team" className={styles.groupAll}>
          Сите <ArrowIcon />
        </Link>
      </div>
      <ul className={styles.aiChipRow}>
        {AI_CHARACTERS.map((a) => (
          <li key={a.key}>
            <button
              type="button"
              className={styles.aiChip}
              onClick={() => openChat?.(a.key)}
              title={`Разговарај со ${a.name} · ${a.role}`}
              aria-label={`Разговарај со ${a.name}, ${a.role}`}
              style={{ '--accent': a.accent }}
            >
              {a.photo
                ? <img src={a.photo} alt="" className={styles.aiChipPhoto} loading="lazy" />
                : <span className={styles.aiChipEmoji} aria-hidden>{a.icon}</span>}
              <span className={styles.aiChipText}>
                <span className={styles.aiChipName}><AgentName name={a.name} /></span>
                <span className={styles.aiChipRole}>{a.role}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Optional, dismissible nudge to set up „Мој профил". Never blocks anything:
// hidden once the profile is ≥70% complete, for sub-seats, or after „Не сега"
// (remembered per browser for 30 days).
const PROFILE_NUDGE_KEY = 'nexa.profileNudgeDismissedAt';
const ProfileSuggestion = () => {
  const { currentUser } = useAuth();
  const [state, setState] = useState(null); // { hasProfile, completion }
  const [hidden, setHidden] = useState(() => {
    try {
      const at = Number(localStorage.getItem(PROFILE_NUDGE_KEY) || 0);
      return at && Date.now() - at < 30 * 86400000;
    } catch { return false; }
  });

  useEffect(() => {
    if (hidden || currentUser?.role === 'sub_seat') return undefined;
    let cancelled = false;
    ApiService.request('/profile/me')
      .then(d => !cancelled && setState({ hasProfile: !!d.profile, completion: d.completion || 0 }))
      .catch(() => {});
    return () => { cancelled = true; };
  }, [hidden, currentUser?.role]);

  if (hidden || !state || state.completion >= 70) return null;

  const dismiss = () => {
    try { localStorage.setItem(PROFILE_NUDGE_KEY, String(Date.now())); } catch { /* ignore */ }
    setHidden(true);
  };

  return (
    <section className={profileStyles.suggest} aria-label="Предлог: профил">
      <span className={profileStyles.suggestText}>
        <strong>{state.hasProfile ? `Профилот е ${state.completion}% комплетен` : 'Претстави ја фирмата во мрежата'}</strong>
        {state.hasProfile
          ? 'Додади што нудите и што барате — така другите фирми знаат како да соработуваат со вас.'
          : 'Опционално: профил со лого, што нудите и што барате. Се пополнува од податоците за фирма.'}
      </span>
      <Link to="/terminal/moj-profil" className={profileStyles.textLink}>
        {state.hasProfile ? 'Дополни' : 'Направи профил'}
      </Link>
      <button type="button" className={profileStyles.textLink} onClick={dismiss}>Не сега</button>
    </section>
  );
};

// Suggested actions — rich tiles whose benefit copy nudges feature discovery.
const SuggestedActions = () => (
  <div className={styles.shortcutGroup}>
    <div className={styles.groupHead}>
      <span className={styles.groupTitle}>Предложено за тебе</span>
    </div>
    <div className={styles.actionGrid}>
      {SUGGESTED_ACTIONS.map((a) => (
        <Link key={a.to} to={a.to} className={styles.actionTile}>
          <span className={`${styles.actionIconWrap} ${styles[`accent_${a.accent}`]}`}>
            <Icon name={a.icon} />
          </span>
          <span className={styles.actionTileBody}>
            <span className={styles.actionTileTitle}>{a.title}</span>
            <span className={styles.actionTileDesc}>{a.desc}</span>
          </span>
          <span className={styles.actionTileArrow}><ArrowIcon /></span>
        </Link>
      ))}
    </div>
  </div>
);

// Compact jump-to row for the most-used templates.
const TemplateRow = () => (
  <div className={styles.shortcutGroup}>
    <div className={styles.groupHead}>
      <span className={styles.groupTitle}>Шаблони</span>
      <Link to="/terminal/documents" className={styles.groupAll}>
        Сите <ArrowIcon />
      </Link>
    </div>
    <div className={styles.chipRow}>
      {TEMPLATE_SHORTCUTS.map((s) => (
        <Link key={s.to} to={s.to} className={styles.chip}>
          <span className={`${styles.chipIcon} ${styles.accent_blue}`}>
            <Icon name="doc" />
          </span>
          <span className={styles.chipLabel}>{s.label}</span>
        </Link>
      ))}
    </div>
  </div>
);

// Quick-actions: always visible (static) and compact, so the Известувања feed
// below stays in view without a tap to expand.
const ActionGridCard = () => (
  <section className={styles.actionCard} aria-label="Брзи дејства">
    <SuggestedActions />
    <TemplateRow />
  </section>
);

// ─────────────────────────────────────────────────────────────────────────────

const UpdateCard = ({ update, onOpen, onPatch }) => {
  const { text: preview } = previewBody(update.body);
  const { openChat } = useChatDock();
  const agentKey = update.authorAgent;

  const toggleLike = async (e) => {
    e.stopPropagation();
    try {
      const r = await ApiService.post(`/updates/${update._id}/like`);
      onPatch(update._id, { likesCount: r.likesCount, likedByMe: r.likedByMe });
    } catch { /* ignore */ }
  };

  return (
    <article className={styles.blogPost}>
      <div
        className={`${styles.blogPostContent} ${styles.updateClickable}`}
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      >
        {agentKey && (
          <div className={styles.feedAuthorRow}>
            <FeedAuthor agentKey={agentKey} />
            <span className={styles.blogPostTime}>{fmtDate(update.publishedAt || update.createdAt)}</span>
          </div>
        )}
        <div className={styles.blogPostMeta}>
          {update.category
            ? <span className={styles.updateCategory}>{update.category}</span>
            : <span />}
          {!agentKey && <span className={styles.blogPostTime}>{fmtDate(update.publishedAt || update.createdAt)}</span>}
        </div>
        <h3 className={styles.blogPostTitle}>{update.title}</h3>
        {update.body && <p className={styles.updateBody}>{preview}</p>}

        <div className={styles.updateFooter}>
          <button
            type="button"
            className={`${styles.engageBtn} ${update.likedByMe ? styles.engageBtnActive : ''}`}
            onClick={toggleLike}
            title="Ми се допаѓа"
          >
            <span className={styles.engageIcon}>{update.likedByMe ? '♥' : '♡'}</span>
            {update.likesCount > 0 && <span>{update.likesCount}</span>}
          </button>
          <button
            type="button"
            className={styles.engageBtn}
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
            title="Коментари"
          >
            <span className={styles.engageIcon}>💬</span>
            <span>{update.commentsCount > 0 ? update.commentsCount : 'Коментирај'}</span>
          </button>
          {agentKey && (
            <button
              type="button"
              className={`${styles.engageBtn} ${styles.askAgentBtn}`}
              onClick={(e) => { e.stopPropagation(); askAboutPost(openChat, agentKey, update); }}
            >
              Прашај {getAgentName(agentKey)} →
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

// Blog article in the feed — opens the full article page in a new tab.
const BlogCard = ({ post }) => (
  <article className={styles.blogPost}>
    <a
      href={`/blog/${post.slug || post._id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.blogPostBody} ${styles.feedBlogBody}`}
    >
      {post.featuredImage && (
        <div className={styles.blogPostImage}>
          <img src={resolveBlogImage(post.featuredImage)} alt="" loading="lazy" />
        </div>
      )}
      <div className={styles.blogPostContent}>
        <div className={styles.blogPostMeta}>
          <span className={styles.feedBlogBadge}>Статија</span>
          <span className={styles.blogPostTime}>{fmtDate(post.createdAt)}</span>
        </div>
        <h3 className={styles.blogPostTitle}>{post.title}</h3>
        {post.excerpt && <p className={styles.blogPostExcerpt}>{stripHtml(post.excerpt)}</p>}
        <span className={styles.feedBlogRead}>Прочитај ја статијата ↗</span>
      </div>
    </a>
  </article>
);

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

    // Topics worklist tile — Topics Q&A is a Pro (B) feature.
    if (tier === 'B') {
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
      {tier === 'B' && (
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

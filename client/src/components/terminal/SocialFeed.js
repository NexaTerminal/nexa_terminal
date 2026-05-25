import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';
import Icon from '../website/Icon';
import styles from '../../styles/terminal/SocialFeed.module.css';

/**
 * Mixed terminal dashboard feed.
 * Cards are heterogeneous: a static action grid at the top, then blog posts
 * with feature spotlights, education promo, and (for admin_user) a lead nudge
 * interleaved at fixed positions so the feed never feels blog-only.
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

// Display labels for blog categories. DB stores English (or unknown) slugs;
// we render Macedonian to the user but keep the raw value as the filter key.
const CATEGORY_LABELS_MK = {
  legal:            'Правни',
  law:              'Правни',
  marketing:        'Маркетинг',
  business:         'Бизнис',
  finance:          'Финансии',
  hr:               'Човечки ресурси',
  tax:              'Даноци',
  taxation:         'Даноци',
  compliance:       'Усогласеност',
  technology:       'Технологија',
  tech:             'Технологија',
  management:       'Менаџмент',
  news:             'Вести',
  general:          'Општи',
  entrepreneurship: 'Претприемништво',
  investment:       'Инвестиции',
  investments:      'Инвестиции'
};
const labelForCategory = (raw) => {
  if (!raw) return '';
  const key = String(raw).trim().toLowerCase();
  return CATEGORY_LABELS_MK[key] || raw;
};

// ─────────────────────────────────────────────────────────────────────────────

const SocialFeed = () => {
  const { token, currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await ApiService.request('/blogs?limit=10&page=1');
      setPosts(data?.blogs || []);
    } catch (err) {
      setError('Настана грешка при вчитување на објавите. Обидете се повторно.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReact = async (blogId, kind) => {
    try {
      const response = await ApiService.post(`/blogs/${blogId}/${kind}`);
      const userId = currentUser?._id || currentUser?.id;
      setPosts(prev => prev.map(post => {
        if ((post.id || post._id) !== blogId) return post;
        const isLiked    = response.isLiked    ?? (kind === 'like'    && true);
        const isDisliked = response.isDisliked ?? (kind === 'dislike' && true);
        const likedBy    = kind === 'like'
          ? (isLiked    ? [...(post.likedBy    || []), userId] : (post.likedBy    || []).filter(id => id !== userId))
          : (isDisliked ? (post.likedBy    || []).filter(id => id !== userId) : (post.likedBy    || []));
        const dislikedBy = kind === 'dislike'
          ? (isDisliked ? [...(post.dislikedBy || []), userId] : (post.dislikedBy || []).filter(id => id !== userId))
          : (isLiked    ? (post.dislikedBy || []).filter(id => id !== userId) : (post.dislikedBy || []));
        return { ...post, likes: response.likes, dislikes: response.dislikes, likedBy, dislikedBy };
      }));
    } catch (err) { console.error('react error', err); }
  };

  // Build distinct category list from loaded posts. Compare on lowercase keys
  // but preserve the first raw value seen so we can echo it back in the filter.
  const seen = new Map();
  for (const p of posts) {
    const raw = (p.category || '').trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    if (!seen.has(key)) seen.set(key, raw);
  }
  const categories = Array.from(seen.values());

  const visiblePosts = filter === 'all'
    ? posts
    : posts.filter(p => (p.category || '').trim().toLowerCase() === filter.toLowerCase());

  const noMatches = filter !== 'all' && visiblePosts.length === 0;

  const buildFeed = () => {
    const items = [{ kind: 'action' }];
    visiblePosts.forEach(blog => items.push({ kind: 'blog', data: blog }));
    return items;
  };

  if (loading && posts.length === 0) {
    return <div className={styles.feedLoading}>Се вчитува…</div>;
  }

  const feed = buildFeed();
  const userId = currentUser?._id || currentUser?.id;

  const blogItems = feed.filter(it => it.kind === 'blog');

  return (
    <div className={styles.socialFeed}>
      {error && <div className={styles.feedError}>{error}</div>}

      <div className={styles.feedStream}>
        <ActionGridCard />

        {categories.length > 0 && (
          <div className={styles.sectionBreak} role="separator" aria-hidden="true">
            <span className={styles.sectionBreakLabel}>Од блогот</span>
          </div>
        )}

        {categories.length > 0 && (
          <div className={styles.topicBar} role="tablist" aria-label="Категории на објави">
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'all'}
              className={`${styles.topicBtn} ${filter === 'all' ? styles.topicBtnActive : ''}`}
              onClick={() => setFilter('all')}
            >
              Сите
            </button>
            {categories.map(c => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={filter === c}
                className={`${styles.topicBtn} ${filter === c ? styles.topicBtnActive : ''}`}
                onClick={() => setFilter(c)}
              >
                {labelForCategory(c)}
              </button>
            ))}
          </div>
        )}

        {noMatches && (
          <div className={styles.topicEmpty}>Нема објави во оваа категорија.</div>
        )}

        {blogItems.map(it => (
          <BlogCard key={it.data.id || it.data._id} blog={it.data} userId={userId} onReact={handleReact} />
        ))}
      </div>
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

function decodeEntities(text) {
  if (!text) return '';
  const ta = document.createElement('textarea');
  ta.innerHTML = text;
  return ta.value;
}

const formatRelative = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const s = Math.floor((Date.now() - date) / 1000);
  if (s < 60)         return `пред ${s}с`;
  if (s < 3600)       return `пред ${Math.floor(s / 60)}м`;
  if (s < 86400)      return `пред ${Math.floor(s / 3600)}ч`;
  return `пред ${Math.floor(s / 86400)}д`;
};

const resolveBlogImg = (src) => {
  if (!src) return null;
  if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/images/')) {
    return encodeURI(src);
  }
  return `${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/uploads/blogs/${encodeURIComponent(src)}`;
};

const BlogCard = ({ blog, userId, onReact }) => {
  const isLiked    = blog.likedBy?.includes(userId);
  const isDisliked = blog.dislikedBy?.includes(userId);
  const excerpt = blog.excerpt ? decodeEntities(blog.excerpt) : '';
  const trimmed = excerpt.length > 140 ? excerpt.slice(0, 140).trimEnd() + '…' : excerpt;

  return (
    <article className={styles.blogPost}>
      <Link to={`/terminal/blogs/${blog.id || blog._id}`} className={styles.blogPostBody}>
        {blog.featuredImage && (
          <div className={styles.blogPostImage}>
            <img
              src={resolveBlogImg(blog.featuredImage)}
              alt={blog.title}
              onError={(e) => { e.target.parentNode.style.display = 'none'; }}
            />
          </div>
        )}
        <div className={styles.blogPostContent}>
          {blog.publishedAt && (
            <div className={styles.blogPostMeta}>
              <span className={styles.blogPostTime}>{formatRelative(blog.publishedAt)}</span>
            </div>
          )}
          <h3 className={styles.blogPostTitle}>{blog.title}</h3>
          {trimmed && <p className={styles.blogPostExcerpt}>{trimmed}</p>}
        </div>
      </Link>
      <footer className={styles.blogPostFooter}>
        <div className={styles.blogPostTags}>
          {(blog.tags || []).slice(0, 2).map(tag => (
            <span key={tag} className={styles.blogPostTag}>#{tag}</span>
          ))}
        </div>
        <div className={styles.blogPostReactions}>
          <button
            type="button"
            className={`${styles.reactBtn} ${isLiked ? styles.reactBtnLiked : ''}`}
            onClick={(e) => { e.preventDefault(); onReact(blog.id || blog._id, 'like'); }}
            title="Добра идеја"
          >
            <span className={styles.reactIcon}>{isLiked ? '💡' : '○'}</span>
            <span>{blog.likes || 0}</span>
          </button>
          <button
            type="button"
            className={`${styles.reactBtn} ${isDisliked ? styles.reactBtnDisliked : ''}`}
            onClick={(e) => { e.preventDefault(); onReact(blog.id || blog._id, 'dislike'); }}
            title="Губење пари"
          >
            <span className={styles.reactIcon}>{isDisliked ? '💸' : '○'}</span>
            <span>{blog.dislikes || 0}</span>
          </button>
        </div>
      </footer>
    </article>
  );
};

export default SocialFeed;

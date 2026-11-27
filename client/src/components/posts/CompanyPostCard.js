import { Link } from 'react-router-dom';
import { mediaUrl } from '../../lib/apiBase';
import styles from './CompanyPostCard.module.css';

/**
 * One structured company post. The design is generated from the fixed fields
 * (no free layout): a type badge, a headline, 1–3 facts and the company.
 * `children` = the action row (differs per surface: feed, one-pager, my posts).
 */
export const TYPE_META = {
  offer:   { label: 'Понуда / акција', tone: 'offer' },
  seeking: { label: 'Бараме',          tone: 'seeking' },
  news:    { label: 'Ново кај нас',    tone: 'news' },
};
const AUDIENCE = { all: 'За сите', business: 'За фирми', consumers: 'За граѓани' };

const fmtDay = (d) => {
  const x = new Date(d);
  return isNaN(x) ? '' : `${String(x.getDate()).padStart(2, '0')}.${String(x.getMonth() + 1).padStart(2, '0')}.${x.getFullYear()}`;
};

export function postFacts(p) {
  const f = p.fields || {};
  if (p.type === 'offer') {
    return [AUDIENCE[f.audience] || null, f.city || null, `Важи до ${fmtDay(p.expiresAt)}`].filter(Boolean);
  }
  if (p.type === 'seeking') {
    return [f.category, f.quantity || null, f.city || null, `Рок ${fmtDay(p.expiresAt)}`].filter(Boolean);
  }
  return [];
}

export default function CompanyPostCard({ post, showAuthor = true, children, id }) {
  const t = TYPE_META[post.type] || TYPE_META.news;
  const a = post.author;
  return (
    <article className={`${styles.card} ${styles['tone_' + t.tone]}`} id={id}>
      <div className={styles.top}>
        <span className={styles.badge}>{t.label}</span>
        <span className={styles.date}>{fmtDay(post.createdAt)}</span>
      </div>
      <h3 className={styles.title}>{post.type === 'news' ? post.fields?.text : post.title}</h3>
      {post.type === 'news' && <div className={styles.kind}>{post.title}</div>}
      {postFacts(post).length > 0 && (
        <ul className={styles.facts}>{postFacts(post).map((x) => <li key={x}>{x}</li>)}</ul>
      )}
      {showAuthor && a?.slug && (
        <Link to={`/f/${a.slug}`} className={styles.author} target="_blank" rel="noopener">
          {a.logo ? <img src={mediaUrl(a.logo)} alt="" /> : <span className={styles.initials}>{(a.name || 'N').slice(0, 1)}</span>}
          <span><strong>{a.name}</strong>{a.city ? <small>{a.city}</small> : null}</span>
        </Link>
      )}
      {children && <div className={styles.actions}>{children}</div>}
    </article>
  );
}

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/terminal/CompanyProfile.module.css';
import { mediaUrl } from '../../lib/apiBase';

/**
 * Company profile rendering, shared by the editor preview, the member view
 * (/terminal/f/:slug) and the public page (/f/:slug).
 * Images are user-provided LINKS — every <img> falls back gracefully.
 */

const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '·';

export const ProfileAvatar = ({ url, name, size = 72 }) => {
  const [broken, setBroken] = useState(false);
  const show = url && !broken;
  return (
    <span className={styles.avatar} style={{ '--size': `${size}px` }}>
      {show
        ? <img src={mediaUrl(url)} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
        : <span className={styles.avatarInitials}>{initials(name)}</span>}
    </span>
  );
};

const Cover = ({ url }) => {
  const [broken, setBroken] = useState(false);
  return (
    <div className={styles.cover}>
      {url && !broken && <img src={mediaUrl(url)} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} />}
    </div>
  );
};

const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

const LINK_LABELS = { linkedin: 'LinkedIn', facebook: 'Facebook', instagram: 'Instagram' };

const ProfileCard = ({ profile, preview = false, compact = false }) => {
  if (!profile) return null;
  const p = profile;
  const links = Object.entries(p.links || {}).filter(([, v]) => v);
  const badges = p.badges || [];
  const meta = p.city || '';

  return (
    <article className={`${styles.card} ${compact ? styles.cardCompact : ''}`}>
      <Cover url={p.coverUrl} />
      <div className={styles.cardHead}>
        <ProfileAvatar url={p.avatarUrl} name={p.displayName} size={76} />
        <div className={styles.headText}>
          <h1 className={styles.name}>{p.displayName || (preview ? 'Име на фирмата' : '')}</h1>
          {p.headline && <p className={styles.headline}>{p.headline}</p>}
          {meta && <p className={styles.meta}>{meta}</p>}
        </div>
      </div>

      {badges.length > 0 && (
        <ul className={styles.badges}>
          {badges.map(b => (
            <li key={b.key} className={styles.badge}>
              {b.href && !preview ? <Link to={b.href}>{b.label}</Link> : b.label}
            </li>
          ))}
        </ul>
      )}

      {p.offers?.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Нудиме</h2>
          <ul className={styles.tags}>{p.offers.map(t => <li key={t} className={styles.tag}>{t}</li>)}</ul>
        </section>
      )}

      {p.lookingFor?.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Бараме</h2>
          <ul className={styles.tags}>{p.lookingFor.map(t => <li key={t} className={`${styles.tag} ${styles.tagSeek}`}>{t}</li>)}</ul>
        </section>
      )}

      {(p.website || links.length > 0 || p.contactEmail) && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Контакт</h2>
          <ul className={styles.contactList}>
            {p.website && <li><a href={p.website} target="_blank" rel="noopener noreferrer nofollow">{hostOf(p.website)}</a></li>}
            {links.map(([k, v]) => (
              <li key={k}><a href={v} target="_blank" rel="noopener noreferrer nofollow">{LINK_LABELS[k]}</a></li>
            ))}
            {p.contactEmail && <li><a href={`mailto:${p.contactEmail}`}>{p.contactEmail}</a></li>}
          </ul>
        </section>
      )}

      {p.memberSince && (
        <p className={styles.since}>
          Член на Nexa од {new Date(p.memberSince).toLocaleDateString('mk-MK', { year: 'numeric', month: 'long' })}
        </p>
      )}
    </article>
  );
};

export default ProfileCard;

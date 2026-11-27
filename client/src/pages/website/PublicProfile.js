import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ApiService from '../../services/api';
import SEOHelmet from '../../components/seo/SEOHelmet';
import ProfileSite from '../../components/profile/ProfileSite';
import styles from '../../styles/terminal/CompanyProfile.module.css';
import { API_BASE } from '../../lib/apiBase';

/**
 * Public company one-pager — /f/:slug. A small website the company shares
 * anywhere (LinkedIn, WhatsApp, Viber, business cards via QR). Crawlers get a
 * server-rendered version from client/api/profile-preview.js.
 */
const SITE = 'https://nexa.mk';
const abs = (u = '') => (!u ? '' : u.startsWith('http') ? u : `${SITE}${u}`);

function jsonLd(p, url) {
  const sameAs = [p.website, p.links?.linkedin, p.links?.facebook, p.links?.instagram].filter(Boolean);
  const org = {
    '@type': 'Organization',
    '@id': `${url}#organization`,
    name: p.displayName,
    url,
    ...(p.headline || p.about ? { description: p.about || p.headline } : {}),
    ...(p.avatarUrl ? { logo: abs(p.avatarUrl) } : {}),
    ...(p.coverUrl || p.avatarUrl ? { image: abs(p.coverUrl || p.avatarUrl) } : {}),
    ...(p.city ? { address: { '@type': 'PostalAddress', addressLocality: p.city, addressCountry: 'MK' } } : {}),
    ...(p.contactEmail ? { email: p.contactEmail } : {}),
    ...(p.phone ? { telephone: p.phone } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(p.offers?.length ? {
      makesOffer: p.offers.map(o => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: o } })),
    } : {}),
  };
  return [{
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url,
    name: p.displayName,
    inLanguage: 'mk',
    ...(p.updatedAt ? { dateModified: p.updatedAt } : {}),
    mainEntity: org,
  }];
}

const PublicProfile = () => {
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [state, setState] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    ApiService.get(`/public/profile/${encodeURIComponent(slug)}`)
      .then((d) => { if (!cancelled) { setProfile(d.profile); setPosts(d.posts || []); setState('ok'); } })
      .catch(() => !cancelled && setState('missing'));
    return () => { cancelled = true; };
  }, [slug]);

  // One view per browser session (owner insights). Best-effort.
  useEffect(() => {
    if (state !== 'ok') return;
    try {
      const key = `pv:${slug}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch { /* private mode — still count */ }
    fetch(`${API_BASE}/public/profile/${encodeURIComponent(slug)}/view`, { method: 'POST', keepalive: true }).catch(() => {});
  }, [state, slug]);

  if (state !== 'ok') {
    return (
      <div className={styles.publicWrap}>
        <SEOHelmet title="Профил · Nexa" canonical={`/f/${slug}`} noIndex />
        <div className={styles.publicBar}>
          <Link to="/" className={styles.publicBrand}>NEXA</Link>
          <Link to="/login" className={styles.textLink}>Најава</Link>
        </div>
        <div className={styles.pageNarrow}>
          <div className={styles.empty}>{state === 'loading' ? 'Се вчитува…' : 'Профилот не постои или е отстранет.'}</div>
        </div>
      </div>
    );
  }

  const p = profile;
  const url = `${SITE}/f/${p.slug}`;
  const description = (p.headline || p.about || [p.offers?.join(', '), p.city].filter(Boolean).join(' · ') || p.displayName).slice(0, 160);
  const cover = p.coverUrl || p.avatarUrl;
  return (
    <>
      <SEOHelmet
        title={`${p.displayName}${p.city ? ` — ${p.city}` : ''}`}
        description={description}
        canonical={`/f/${p.slug}`}
        ogImage={cover ? abs(cover) : undefined}
        ogImageWidth={p.coverUrl ? 1600 : cover ? 400 : 1200}
        ogImageHeight={p.coverUrl ? 900 : cover ? 400 : 630}
        ogImageAlt={p.displayName}
        type="profile"
        noIndex={!p.indexable}
        jsonLd={jsonLd(p, url)}
      />
      <ProfileSite profile={p} shareUrl={url} posts={posts} />
    </>
  );
};

export default PublicProfile;

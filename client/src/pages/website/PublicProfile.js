import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ApiService from '../../services/api';
import ProfileCard from '../../components/profile/ProfileCard';
import styles from '../../styles/terminal/CompanyProfile.module.css';

/**
 * Public company profile — /f/:slug. Only profiles their owner made public.
 * The bottom CTA is the growth loop: every shared profile invites a new company.
 */
const PublicProfile = () => {
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    ApiService.get(`/public/profile/${encodeURIComponent(slug)}`)
      .then((d) => {
        if (cancelled) return;
        setProfile(d.profile);
        setState('ok');
        document.title = `${d.profile.displayName} — Nexa`;
        const desc = d.profile.headline || [d.profile.offers?.join(', '), d.profile.city].filter(Boolean).join(' · ');
        let m = document.querySelector('meta[name="description"]');
        if (!m) { m = document.createElement('meta'); m.name = 'description'; document.head.appendChild(m); }
        m.content = desc;
      })
      .catch(() => !cancelled && setState('missing'));
    return () => { cancelled = true; };
  }, [slug]);

  return (
    <div className={styles.publicWrap}>
      <div className={styles.publicBar}>
        <Link to="/" className={styles.publicBrand}>NEXA</Link>
        <Link to="/login" className={styles.textLink}>Најава</Link>
      </div>
      <div className={styles.pageNarrow}>
        {state === 'loading' && <div className={styles.empty}>Се вчитува…</div>}
        {state === 'missing' && <div className={styles.empty}>Профилот не постои или не е јавен.</div>}
        {state === 'ok' && <ProfileCard profile={profile} />}
      </div>
      <div className={styles.cta}>
        <span>Nexa е деловна мрежа за мали фирми — со AI тим, документи и проверки. Бесплатно.</span>
        <Link to="/login" className={styles.textLink}>Креирај бесплатен профил →</Link>
      </div>
    </div>
  );
};

export default PublicProfile;

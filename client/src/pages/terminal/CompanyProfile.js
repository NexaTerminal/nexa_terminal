import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ApiService from '../../services/api';
import TerminalShell from '../../components/terminal/TerminalShell';
import ProfileCard from '../../components/profile/ProfileCard';
import styles from '../../styles/terminal/CompanyProfile.module.css';

/** Member view of a company profile — /terminal/f/:slug. */
const CompanyProfile = () => {
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [state, setState] = useState('loading'); // loading | ok | missing

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    ApiService.request(`/profile/${encodeURIComponent(slug)}`)
      .then((d) => { if (!cancelled) { setProfile(d.profile); setState('ok'); } })
      .catch(() => !cancelled && setState('missing'));
    return () => { cancelled = true; };
  }, [slug]);

  return (
    <TerminalShell>
      <div className={styles.pageNarrow}>
        {state === 'loading' && <div className={styles.empty}>Се вчитува…</div>}
        {state === 'missing' && <div className={styles.empty}>Профилот не постои или е скриен.</div>}
        {state === 'ok' && (
          <>
            {profile.isMine && (
              <div className={styles.topLinks}>
                <a className={styles.textLink} href={`/f/${profile.slug}`} target="_blank" rel="noopener noreferrer">Јавен преглед ↗</a>
                <Link className={styles.textLink} to="/terminal/moj-profil">Уреди профил</Link>
              </div>
            )}
            <ProfileCard profile={profile} />
          </>
        )}
      </div>
    </TerminalShell>
  );
};

export default CompanyProfile;

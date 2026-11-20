import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ApiService from '../../services/api';
import ProfileCard from './ProfileCard';
import styles from '../../styles/terminal/CompanyProfile.module.css';

/**
 * Small, read-only company profile popup — opened by clicking a member's name
 * or logo (comments today; any future post/byline can reuse it). Sits ABOVE
 * other modals: it stops Escape and outside-clicks from reaching the modal
 * underneath, so only this one closes.
 */
const ProfilePreviewModal = ({ slug, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [state, setState] = useState('loading'); // loading | ok | missing
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ApiService.request(`/profile/${encodeURIComponent(slug)}`)
      .then((d) => { if (!cancelled) { setProfile(d.profile); setState('ok'); } })
      .catch(() => !cancelled && setState('missing'));
    return () => { cancelled = true; };
  }, [slug]);

  // Capture-phase Escape: close only this popup, not the modal beneath it.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const publicUrl = `${window.location.origin}/f/${slug}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(publicUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };

  // React events bubble through portals to the parent modal — stop them here.
  const stop = (e) => e.stopPropagation();

  return createPortal((
    <div className={styles.previewOverlay} onMouseDown={(e) => { stop(e); onClose(); }} onClick={stop}>
      <div className={styles.previewModal} onMouseDown={stop} role="dialog" aria-modal="true" aria-label="Профил на фирма">
        <button type="button" className={styles.previewClose} onClick={onClose} aria-label="Затвори">×</button>
        {state === 'loading' && <div className={styles.empty}>Се вчитува…</div>}
        {state === 'missing' && <div className={styles.empty}>Профилот не е достапен.</div>}
        {state === 'ok' && (
          <>
            <ProfileCard profile={profile} compact />
            <div className={styles.previewFoot}>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className={styles.textLink}>
                {window.location.host}/f/{slug} ↗
              </a>
              <button type="button" className={styles.textLink} onClick={copy}>{copied ? 'Копирано ✓' : 'Копирај линк'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  ), document.body);
};

export default ProfilePreviewModal;

import React, { useState } from 'react';
import styles from './ProfileSite.module.css';

/**
 * Share buttons for a company page: LinkedIn, WhatsApp, Viber, e-mail, copy
 * link and the phone's native share sheet. (No Facebook button — product call.)
 */
const ICONS = {
  linkedin: 'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.6 8.65 21 11.1 21 14.3V21h-4v-5.9c0-1.4-.03-3.2-1.95-3.2-1.95 0-2.25 1.52-2.25 3.1V21H9z',
  whatsapp: 'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3 .78.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.25-.12-1.47-.72-1.7-.8-.23-.09-.4-.12-.56.12-.17.25-.64.8-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.1-.5.12-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.43h-.48a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07s.89 2.4 1.01 2.57c.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.6.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29z',
  viber: 'M11.4 2C6.8 2.1 3.3 3.5 2.6 8.7c-.4 2.9-.3 6.1 1.6 8.3.9 1 2 1.5 2.9 1.8v3.3c0 .4.5.6.8.3l2.4-2.6c.6 0 1.1.1 1.7.1 4.4-.1 8.4-1.5 9.2-6.6.5-3.4.2-7.7-2.6-9.6C17 2.6 14.2 1.9 11.4 2zm.2 1.9c2.4 0 4.8.5 6.2 1.6 2.2 1.6 2.3 5.1 1.9 7.9-.6 4-3.6 5-7.3 5.1-.6 0-1.3 0-1.9-.1l-1.6 1.8v-2.1c-.9-.2-1.9-.6-2.6-1.4-1.5-1.7-1.6-4.4-1.2-6.9.5-4 3.3-5.8 6.5-5.9zm.3 2.1a.4.4 0 0 0 0 .8c2.4.1 4.1 1.8 4.2 4.2a.4.4 0 0 0 .8 0c-.1-2.8-2.2-4.9-5-5zm-3.1.9c-.3 0-.6.2-.9.5-.5.5-1 1.1-.7 1.9.8 2 2 3.8 3.7 5.1.6.5 1.3.9 2.1 1.1.6.2 1.1-.2 1.5-.7.3-.4.3-.9-.1-1.2l-1.3-1c-.4-.3-.9-.2-1.2.2l-.4.4c-1.1-.5-2-1.5-2.5-2.6l.4-.4c.4-.3.4-.8.2-1.2l-1-1.4a.8.8 0 0 0-.6-.3zm3.2.4a.4.4 0 0 0 0 .8c1.3.1 2 .8 2.1 2.1a.4.4 0 0 0 .8 0c-.1-1.7-1.2-2.8-2.9-2.9zm.2 1.6a.4.4 0 0 0 0 .8c.4 0 .6.2.6.6a.4.4 0 0 0 .8 0c0-.8-.6-1.4-1.4-1.4z',
  mail: 'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1.4 2L12 12.2 19.6 7zM20 8.7l-7.4 5.1a1 1 0 0 1-1.2 0L4 8.7V17h16z',
  link: 'M10.6 13.4a1 1 0 0 1 0-1.4l3-3a1 1 0 1 1 1.4 1.4l-3 3a1 1 0 0 1-1.4 0zM8.5 19a4.5 4.5 0 0 1-3.2-7.7l2.1-2.1a1 1 0 1 1 1.4 1.4l-2.1 2.1a2.5 2.5 0 0 0 3.5 3.5l2.1-2.1a1 1 0 1 1 1.4 1.4l-2.1 2.1A4.5 4.5 0 0 1 8.5 19zm7.4-4.8a1 1 0 0 1-.7-1.7l2.1-2.1a2.5 2.5 0 0 0-3.5-3.5l-2.1 2.1a1 1 0 1 1-1.4-1.4l2.1-2.1a4.5 4.5 0 0 1 6.4 6.4l-2.1 2.1a1 1 0 0 1-.8.2z',
  share: 'M18 16a3 3 0 0 0-2.4 1.2l-6.7-3.4a3 3 0 0 0 0-1.6l6.7-3.4A3 3 0 1 0 15 7a3 3 0 0 0 .1.8L8.4 11.2a3 3 0 1 0 0 3.6l6.7 3.4A3 3 0 1 0 18 16z',
};

const Svg = ({ d }) => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d={d} /></svg>;

export default function ShareLinks({ url, title = '', text = '', compact = false }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const msg = encodeURIComponent([title, text].filter(Boolean).join(' — ') + ' ' + url);
  const links = [
    ['LinkedIn', ICONS.linkedin, `https://www.linkedin.com/sharing/share-offsite/?url=${u}`],
    ['WhatsApp', ICONS.whatsapp, `https://wa.me/?text=${msg}`],
    ['Viber', ICONS.viber, `viber://forward?text=${msg}`],
    ['Е-пошта', ICONS.mail, `mailto:?subject=${encodeURIComponent(title)}&body=${msg}`],
  ];
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch { /* old browsers: user can copy manually */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const canNative = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className={`${styles.share} ${compact ? styles.shareCompact : ''}`}>
      {links.map(([label, d, href]) => (
        <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className={styles.shareBtn} aria-label={`Сподели на ${label}`}>
          <Svg d={d} /><span>{label}</span>
        </a>
      ))}
      <button type="button" className={styles.shareBtn} onClick={copy}>
        <Svg d={ICONS.link} /><span>{copied ? 'Копирано ✓' : 'Копирај линк'}</span>
      </button>
      {canNative && (
        <button type="button" className={styles.shareBtn} onClick={() => navigator.share({ title, text, url }).catch(() => {})}>
          <Svg d={ICONS.share} /><span>Повеќе…</span>
        </button>
      )}
    </div>
  );
}

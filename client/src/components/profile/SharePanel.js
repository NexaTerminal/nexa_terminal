import React, { useEffect, useState } from 'react';
import ShareLinks from './ShareLinks';
import styles from '../../styles/terminal/CompanyProfile.module.css';

/** „Сподели" — public link, share buttons and a QR code for print. */
export default function SharePanel({ url, title, text }) {
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import('qrcode')
      .then(({ toDataURL }) => toDataURL(url, { width: 520, margin: 1, color: { dark: '#0B1220', light: '#FFFFFF' } }))
      .then((d) => !cancelled && setQr(d))
      .catch(() => {});
    return () => { cancelled = true; };
  }, [url]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch { /* manual copy */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <h2 className={styles.groupTitle}>Вашата страница</h2>
        <a href={url} target="_blank" rel="noopener noreferrer" className={styles.textLink}>Отвори ↗</a>
      </div>
      <div className={styles.urlRow}>
        <input className={styles.input} value={url} readOnly onFocus={(e) => e.target.select()} />
        <button type="button" className={styles.textLink} onClick={copy}>{copied ? 'Копирано ✓' : 'Копирај'}</button>
      </div>
      <ShareLinks url={url} title={title} text={text} compact />
      {qr && (
        <div className={styles.qrRow}>
          <img src={qr} alt="QR код до Вашата страница" className={styles.qr} />
          <div>
            <p className={styles.help}>QR код за визит-карти, флаери, излог или фактури — скенирањето ја отвора Вашата страница.</p>
            <a href={qr} download="nexa-profil-qr.png" className={styles.textLink}>Преземи QR (PNG)</a>
          </div>
        </div>
      )}
    </div>
  );
}

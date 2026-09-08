import React, { useState, useCallback } from 'react';
import s from '../../pages/website/EmployerBadge.module.css';

/**
 * Reusable badge seal + share panel (embed snippet, copy verify link, LinkedIn,
 * download PDF). Used both right after claiming and from the terminal
 * „Мојата значка" page so the user can re-grab the link anytime.
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

export default function BadgeSharePanel({ token }) {
  const [copied, setCopied] = useState('');
  const copy = useCallback((text, key) => {
    try { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1800); } catch (_) { /* ignore */ }
  }, []);

  if (!token) return null;

  const verifyUrl = `${window.location.origin}/badge/${token}`;
  const sealUrl = `${API_BASE}/public/employer-badge/verify/${token}/image.svg`;
  const certUrl = `${API_BASE}/public/employer-badge/verify/${token}/certificate.pdf`;
  const embed = `<a href="${verifyUrl}" target="_blank" rel="noopener"><img src="${sealUrl}" width="140" height="140" alt="Nexa Проверен работодавач" /></a>`;
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`;

  return (
    <>
      <div className={s.sealWrap}>
        <img src={sealUrl} alt="Nexa Проверен работодавач" />
      </div>

      <div className={s.sharePanel}>
        <h2 className={s.shareTitle}>Споделете ја значката</h2>
        <p className={s.shareHint}>Поставете ја на вашата страница или на огласите за работа (кликот води до вашата јавна потврда):</p>
        <code className={s.embedBox}>{embed}</code>
        <div className={s.shareRow}>
          <button type="button" className={s.shareBtn} onClick={() => copy(embed, 'embed')}>
            {copied === 'embed' ? 'Копирано ✓' : 'Копирај код за вградување'}
          </button>
          <button type="button" className={s.shareBtnGhost} onClick={() => copy(verifyUrl, 'link')}>
            {copied === 'link' ? 'Копирано ✓' : 'Копирај линк за потврда'}
          </button>
          <a className={s.shareBtn} href={linkedin} target="_blank" rel="noopener noreferrer">Сподели на LinkedIn</a>
          <a className={s.shareBtnGhost} href={certUrl} target="_blank" rel="noopener noreferrer">Преземи потврда (PDF)</a>
        </div>
      </div>

      <p className={s.verifyMeta}>
        Јавна потврда: <a href={verifyUrl} target="_blank" rel="noopener noreferrer">{verifyUrl}</a>
      </p>
    </>
  );
}

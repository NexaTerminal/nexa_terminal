import React, { useRef, useState } from 'react';
import ApiService from '../../services/api';
import { resizeImage } from '../../lib/imageResize';
import styles from '../../styles/terminal/CompanyProfile.module.css';
import { mediaUrl } from '../../lib/apiBase';

/**
 * Logo / cover picker for „Мој профил": upload (resized in the browser, stored
 * by Nexa) or paste a link. `kind` = 'avatar' | 'cover'.
 */
const SPEC = {
  avatar: { maxWidth: 512, maxHeight: 512, keepPng: true, label: 'Лого', hint: 'Квадратно, најмалку 256×256 px. PNG со провидна позадина изгледа најдобро.' },
  cover: { maxWidth: 1600, maxHeight: 1000, keepPng: false, label: 'Насловна слика', hint: 'Широка фотографија (пр. 1600×900): Вашиот простор, производ или тим. Се прикажува најгоре на страницата и кога се споделува линкот.' },
};

export default function ImageUpload({ kind, value, onChange }) {
  const spec = SPEC[kind];
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showLink, setShowLink] = useState(false);
  const isOwn = /^\/api\/public\/profile\/img\//.test(value || '');

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(''); setBusy(true);
    try {
      const dataUrl = await resizeImage(file, spec);
      const { url } = await ApiService.put(`/profile/me/image/${kind}`, { dataUrl });
      onChange(url);
    } catch (err) {
      setError(err?.message && !/status/i.test(err.message) ? err.message : 'Прикачувањето не успеа.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setError('');
    if (isOwn) { try { await ApiService.delete(`/profile/me/image/${kind}`); } catch { /* clear locally anyway */ } }
    onChange('');
  };

  return (
    <div className={styles.row}>
      <label className={styles.label}>{spec.label}</label>
      <div className={`${styles.imagePick} ${kind === 'cover' ? styles.imagePickCover : ''}`}>
        <div className={kind === 'cover' ? styles.coverThumb : styles.logoThumb}>
          {value ? <img src={mediaUrl(value)} alt="" /> : <span>{kind === 'cover' ? 'Без насловна слика' : 'Лого'}</span>}
        </div>
        <div className={styles.imageActions}>
          <button type="button" className={styles.textLink} onClick={() => input.current?.click()} disabled={busy}>
            {busy ? 'Се прикачува…' : value ? 'Замени слика' : 'Прикачи слика'}
          </button>
          {value && <button type="button" className={`${styles.textLink} ${styles.textLinkDanger}`} onClick={remove}>Отстрани</button>}
          <button type="button" className={styles.textLinkMuted} onClick={() => setShowLink(v => !v)}>или залепи линк</button>
        </div>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} />
      </div>
      {showLink && (
        <input className={styles.input} value={isOwn ? '' : (value || '')} onChange={(e) => onChange(e.target.value)} placeholder="https://…" />
      )}
      <p className={styles.help}>{spec.hint}</p>
      {error && <p className={styles.fieldError}>{error}</p>}
    </div>
  );
}

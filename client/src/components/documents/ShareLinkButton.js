import React, { useState } from 'react';
import { isShareable } from '../../config/documents/shareableDocuments';
import styles from '../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Pro-only "Сподели линк" — mints a public, short-lived link for THIS document so a
 * client can fill the form and generate the .docx themselves (charged to the Pro's
 * credits). Renders nothing for documents that aren't enabled for sharing.
 */
const authHeader = () => {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

// Keep only scalar, non-internal, non-empty values (mirrors the server) so the signed
// link stays short and we never ship control keys.
const cleanPrefill = (obj) => {
  const out = {};
  if (!obj || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj)) {
    if (!k || k.startsWith('_') || k === 'acceptTerms' || k === 'clientId') continue;
    if (v == null) continue;
    const t = typeof v;
    if (t === 'string') { if (v.trim()) out[k] = v; }
    else if (t === 'number' || t === 'boolean') out[k] = v;
  }
  return out;
};

const ShareLinkButton = ({ config, formData }) => {
  const apiEndpoint = config && config.apiEndpoint;
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [prefillFromForm, setPrefillFromForm] = useState(false);
  const [lockPrefilled, setLockPrefilled] = useState(false);

  if (!apiEndpoint || !isShareable(apiEndpoint)) return null;

  const create = async () => {
    setStatus('loading'); setError(''); setCopied(false);
    try {
      const prefill = prefillFromForm ? cleanPrefill(formData) : null;
      const locked = prefill && lockPrefilled ? Object.keys(prefill) : null;
      const res = await fetch('/api/document-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          apiEndpoint,
          documentType: config.documentType,
          ...(formData && formData.clientId ? { clientId: formData.clientId } : {}),
          ...(prefill && Object.keys(prefill).length ? { prefill } : {}),
          ...(locked && locked.length ? { locked } : {})
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.message || `Грешка (${res.status})`);
      setUrl(data.url);
      setStatus('done');
    } catch (e) {
      setError(e.message || 'Грешка при креирање на линкот.');
      setStatus('error');
    }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch (_) { /* clipboard may be blocked; the field is selectable */ }
  };

  return (
    <div className={styles['info-box']}>
      <strong>🔗 Сподели линк за овој документ</strong>
      <p>Испратете линк до клиент — тој ги пополнува податоците и го презема документот. Генерирањето се наплаќа од вашите кредити.</p>
      {status !== 'done' ? (
        <>
          <div className={styles['checkbox-group']}>
            <input type="checkbox" id="share_prefill" checked={prefillFromForm} onChange={(e) => { setPrefillFromForm(e.target.checked); if (!e.target.checked) setLockPrefilled(false); }} />
            <label htmlFor="share_prefill">Пополни го линкот однапред со податоците што ги внесов</label>
          </div>
          {prefillFromForm && (
            <div className={styles['checkbox-group']}>
              <input type="checkbox" id="share_lock" checked={lockPrefilled} onChange={(e) => setLockPrefilled(e.target.checked)} />
              <label htmlFor="share_lock">Заклучи ги тие полиња (клиентот не може да ги менува)</label>
            </div>
          )}
          <button type="button" className={`${styles.btn} ${styles['next-btn']}`} onClick={create} disabled={status === 'loading'}>
            {status === 'loading' ? 'Се креира…' : 'Создади линк за споделување'}
          </button>
        </>
      ) : (
        <div className={styles['form-group']}>
          <input type="text" readOnly value={url} onFocus={(e) => e.target.select()} />
          <div className={styles['navigation-buttons']}>
            <button type="button" className={`${styles.btn} ${styles['next-btn']}`} onClick={copy}>
              {copied ? '✅ Копирано' : 'Копирај линк'}
            </button>
            <button type="button" className={`${styles.btn} ${styles['prev-btn']}`} onClick={create}>Нов линк</button>
          </div>
          <p className={styles['preview-hint']}>Линкот е привремен и истекува по кратко време.</p>
        </div>
      )}
      {status === 'error' && <span className={styles['error-message']}>{error}</span>}
    </div>
  );
};

export default ShareLinkButton;

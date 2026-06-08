import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import styles from './Fair.module.css';

const TYPE_LABEL = { product: 'Производ', service: 'Услуга' };

export default function FairBoothDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const [booth, setBooth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [inquiryFor, setInquiryFor] = useState(null); // offer snippet or '' for general
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios.get(`/api/fair/${id}`, auth)
      .then(r => { if (!cancelled) setBooth(r.data?.booth || null); })
      .catch(() => { if (!cancelled) setBooth(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const openInquiry = (offerText = '') => { setInquiryFor(offerText); setMessage(''); };

  const submitInquiry = async () => {
    if (message.trim().length < 10) { setToast({ type: 'err', text: 'Пораката е премногу кратка.' }); return; }
    setSending(true);
    try {
      await axios.post(`/api/fair/${id}/inquiry`, { message: message.trim(), offerTitle: inquiryFor || '' }, auth);
      setInquiryFor(null);
      setToast({ type: 'ok', text: 'Барањето е испратено.' });
    } catch (e) {
      setToast({ type: 'err', text: e.response?.data?.message || 'Грешка при испраќање.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <TerminalShell>
      <div className={styles.page}>
        <Link to="/terminal/fair" className={styles.btnGhost}>← Назад на саемот</Link>

        {loading ? (
          <div className={styles.loading}>Се вчитува…</div>
        ) : !booth ? (
          <div className={styles.empty}>Штандот не е пронајден.</div>
        ) : (
          <>
            {booth.imageUrl && (
              <img className={styles.cover} src={booth.imageUrl} alt={booth.companyName} />
            )}

            <div className={styles.boothHead} style={{ marginTop: 16 }}>
              {booth.logoUrl
                ? <img className={styles.logo} src={booth.logoUrl} alt={booth.companyName} />
                : <div className={`${styles.logo} ${styles.logoFallback}`}>{(booth.companyName || '?').charAt(0)}</div>}
              <div>
                <h1 className={styles.title}>{booth.companyName}</h1>
                {booth.city && <div className={styles.city}>{booth.city}</div>}
                <div className={styles.contactRow}>
                  {booth.website && (
                    <a className={styles.contactLink} href={booth.website} target="_blank" rel="noopener noreferrer">
                      🔗 {booth.website.replace(/^https?:\/\//i, '')}
                    </a>
                  )}
                  {booth.contactEmail && (
                    <a className={styles.contactLink} href={`mailto:${booth.contactEmail}`}>✉ {booth.contactEmail}</a>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.offers}>
              {(booth.offers || []).map((o, i) => (
                <div key={i} className={styles.offer}>
                  <div className={styles.offerBody}>
                    <span className={`${styles.typeBadge} ${o.type === 'product' ? styles.typeProduct : styles.typeService}`}>
                      {TYPE_LABEL[o.type] || o.type}
                    </span>
                    <p className={styles.offerDesc}>{o.text}</p>
                    {o.whyUs && (
                      <div className={styles.whyUs}>
                        <strong>Зошто ние</strong>
                        {o.whyUs}
                      </div>
                    )}
                    <button className={styles.btnGhost} onClick={() => openInquiry(o.text)}>Испрати барање</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24 }}>
              <button className={styles.btnPrimary} onClick={() => openInquiry('')}>Контактирај ја компанијата</button>
            </div>
          </>
        )}
      </div>

      {inquiryFor !== null && (
        <div className={styles.overlay} onClick={() => !sending && setInquiryFor(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Испрати барање</h3>
            <p className={styles.hint}>Вашата компанија и е-пошта ќе бидат споделени со штандот за да ви одговорат.</p>
            <textarea
              className={styles.textarea}
              placeholder="Опишете што ве интересира…"
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={2000}
              rows={5}
            />
            <div className={styles.actions} style={{ marginTop: 12 }}>
              <button className={styles.btnPrimary} onClick={submitInquiry} disabled={sending}>
                {sending ? 'Се испраќа…' : 'Испрати'}
              </button>
              <button className={styles.btnGhost} onClick={() => setInquiryFor(null)} disabled={sending}>Откажи</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'ok' ? styles.toastOk : styles.toastErr}`} onClick={() => setToast(null)}>
          {toast.text}
        </div>
      )}
    </TerminalShell>
  );
}

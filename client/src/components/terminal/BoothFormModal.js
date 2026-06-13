import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import FeatureTermsModal from './FeatureTermsModal';
import useTermsGate from '../../hooks/useTermsGate';
import styles from '../../pages/terminal/Fair.module.css';

const MAX_OFFERS = 3;
const TYPE_LABEL = { service: 'Услуга', product: 'Производ' };
const placeholderFor = (type) => type === 'product' ? 'Опишете го производот…' : 'Опишете ја услугата…';

/**
 * Minimal booth editor (modal). No category/tagline — just a managed list of up
 * to 3 offers, each { type: service|product, text }. One general input + type
 * toggle to add; Уреди / Избриши per listed offer. Commits on Зачувај и објави.
 */
export default function BoothFormModal({ open, onClose, onSaved }) {
  const { token } = useAuth();
  const { requireTerms, termsModal } = useTermsGate();
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [offers, setOffers] = useState([]);        // committed list [{type,text,whyUs}]
  const [draftType, setDraftType] = useState('service');
  const [draftText, setDraftText] = useState('');
  const [draftWhyUs, setDraftWhyUs] = useState('');
  const [editIndex, setEditIndex] = useState(null); // index being edited, or null

  // Booth-level decoration
  const [website, setWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true); setError(''); setDraftText(''); setDraftWhyUs(''); setDraftType('service'); setEditIndex(null);
    setWebsite(''); setContactEmail(''); setImageUrl('');
    axios.get('/api/fair/me', auth)
      .then(r => {
        if (cancelled) return;
        const b = r.data?.booth;
        setOffers((b?.offers || []).map(o => ({ type: o.type || 'service', text: o.text || '', whyUs: o.whyUs || '' })));
        setWebsite(b?.website || '');
        setContactEmail(b?.contactEmail || '');
        setImageUrl(b?.imageUrl || '');
      })
      .catch(() => { if (!cancelled) setOffers([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const resetDraft = () => { setDraftText(''); setDraftWhyUs(''); setDraftType('service'); setEditIndex(null); };

  const addOrUpdate = () => {
    const text = draftText.trim();
    const whyUs = draftWhyUs.trim();
    if (!text) { setError('Внесете текст за понудата.'); return; }
    setError('');
    if (editIndex !== null) {
      setOffers(prev => prev.map((o, i) => i === editIndex ? { type: draftType, text, whyUs } : o));
    } else {
      if (offers.length >= MAX_OFFERS) { setError(`Максимум ${MAX_OFFERS} понуди.`); return; }
      setOffers(prev => [...prev, { type: draftType, text, whyUs }]);
    }
    resetDraft();
  };

  const editOffer = (idx) => { setEditIndex(idx); setDraftType(offers[idx].type); setDraftText(offers[idx].text); setDraftWhyUs(offers[idx].whyUs || ''); setError(''); };
  const deleteOffer = (idx) => {
    setOffers(prev => prev.filter((_, i) => i !== idx));
    if (editIndex === idx) resetDraft();
  };

  const uploadCover = async (file) => {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const r = await axios.post('/api/fair/me/image', fd, {
        headers: { ...auth.headers, 'Content-Type': 'multipart/form-data' }
      });
      setImageUrl(r.data?.url || '');
    } catch (e) {
      setError(e.response?.data?.message || 'Грешка при прикачување.');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (offers.length === 0) { setError('Додадете барем една понуда.'); return; }
    setSaving(true); setError('');
    try {
      await axios.put('/api/fair/me', { offers, website, contactEmail, imageUrl }, auth);
      setSaving(false);
      onSaved && onSaved();
    } catch (e) {
      setSaving(false);
      setError(e.response?.data?.message || 'Грешка при зачувување.');
    }
  };

  const canAddMore = offers.length < MAX_OFFERS || editIndex !== null;

  return (
    <>
    <div className={styles.overlay} onClick={() => !saving && onClose()}>
      <div className={`${styles.modal} ${styles.modalWide}`} onClick={e => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Мој штанд</h3>

        {loading ? (
          <div className={styles.loading}>Се вчитува…</div>
        ) : (
          <>
            <div className={styles.modalScroll}>
              {/* Booth-level info */}
              <div className={styles.boothInfo}>
                <div className={styles.field}>
                  <label className={styles.label}>Слика на штандот</label>
                  {imageUrl
                    ? (
                      <div className={styles.coverWrap}>
                        <img className={styles.coverThumb} src={imageUrl} alt="" />
                        <button type="button" className={`${styles.btnGhost} ${styles.btnDanger}`} onClick={() => setImageUrl('')}>Отстрани слика</button>
                      </div>
                    )
                    : <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={e => uploadCover(e.target.files?.[0])} />}
                  {uploading && <span className={styles.hint}>Се прикачува…</span>}
                </div>
                <div className={styles.row2col}>
                  <div className={styles.field}>
                    <label className={styles.label}>Веб-страница</label>
                    <input className={styles.input} value={website} maxLength={200} placeholder="www.example.mk" onChange={e => setWebsite(e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Контакт е-пошта</label>
                    <input className={styles.input} value={contactEmail} maxLength={120} placeholder="kontakt@example.mk" onChange={e => setContactEmail(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Adder / editor */}
              {canAddMore && (
                <div className={styles.adder}>
                  <div className={styles.typeToggle}>
                    <button type="button" className={draftType === 'service' ? styles.on : ''} onClick={() => setDraftType('service')}>Услуга</button>
                    <button type="button" className={draftType === 'product' ? styles.on : ''} onClick={() => setDraftType('product')}>Производ</button>
                  </div>
                  <textarea
                    className={styles.textarea}
                    value={draftText}
                    maxLength={600}
                    rows={2}
                    placeholder={placeholderFor(draftType)}
                    onChange={e => setDraftText(e.target.value)}
                  />
                  <textarea
                    className={styles.textarea}
                    value={draftWhyUs}
                    maxLength={400}
                    rows={2}
                    placeholder="Зошто ние (опционално)"
                    onChange={e => setDraftWhyUs(e.target.value)}
                  />
                  <div className={styles.actions}>
                    <button type="button" className={styles.btnPrimary} onClick={addOrUpdate}>
                      {editIndex !== null ? 'Зачувај измена' : 'Додади'}
                    </button>
                    {editIndex !== null && (
                      <button type="button" className={styles.btnGhost} onClick={resetDraft}>Откажи измена</button>
                    )}
                  </div>
                </div>
              )}

              {/* Committed list */}
              {offers.length > 0 && (
                <div className={styles.offerList}>
                  <div className={styles.listHead}>Мои понуди ({offers.length}/{MAX_OFFERS})</div>
                  {offers.map((o, idx) => (
                    <div key={idx} className={styles.listItem}>
                      <span className={`${styles.typeBadge} ${o.type === 'product' ? styles.typeProduct : styles.typeService}`}>
                        {TYPE_LABEL[o.type]}
                      </span>
                      <span className={styles.listText}>{o.text}</span>
                      <span className={styles.listBtns}>
                        <button type="button" className={styles.btnGhost} onClick={() => editOffer(idx)}>Уреди</button>
                        <button type="button" className={`${styles.btnGhost} ${styles.btnDanger}`} onClick={() => deleteOffer(idx)}>Избриши</button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <p className={styles.error} style={{ marginTop: 10 }}>{error}</p>}

            <div className={styles.actions} style={{ marginTop: 16 }}>
              <button type="button" className={styles.btnPrimary} onClick={() => requireTerms('fair', save)} disabled={saving}>
                {saving ? 'Се зачувува…' : 'Зачувај и објави'}
              </button>
              <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>Откажи</button>
            </div>
          </>
        )}
      </div>
    </div>
    {termsModal && <FeatureTermsModal {...termsModal} />}
    </>
  );
}

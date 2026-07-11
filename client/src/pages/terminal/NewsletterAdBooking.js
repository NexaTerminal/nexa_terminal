import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { CURRENT_VERSIONS } from '../../data/featureTerms';
import FeatureTermsModal from '../../components/terminal/FeatureTermsModal';
import shared from './BlogSubmissions.module.css';
import styles from './NewsletterAdBooking.module.css';

const SLOTS_PER_MONTH = 3;

// Hardcoded — toLocaleDateString('mk-MK') falls back to English in browsers
// without the Macedonian locale data.
const MK_MONTHS = ['Јануари', 'Февруари', 'Март', 'Април', 'Мај', 'Јуни',
  'Јули', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'];

const monthLabel = (monthKey) => {
  if (!monthKey) return '—';
  const [y, m] = String(monthKey).split('-').map(Number);
  return `${MK_MONTHS[m - 1]} ${y}`;
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

/* CSS-only skeleton of the monthly email so the user sees exactly where the
   banner lands: header, article blocks, and 3 highlighted banner slots. */
function NewsletterMockup({ availability, selectedMonth }) {
  const sel = availability.find(m => m.monthKey === selectedMonth);
  const slotTaken = (n) => sel ? n <= sel.slotsUsed : false;
  const Slot = ({ n }) => (
    <div className={`${styles.mockSlot} ${slotTaken(n) ? styles.mockSlotTaken : ''}`}>
      <span className={styles.mockSlotLabel}>
        {slotTaken(n) ? `Слот ${n} — зафатен` : `Вашиот банер тука · Слот ${n}`}
      </span>
    </div>
  );
  return (
    <div className={styles.mockup} aria-hidden="true">
      <div className={styles.mockHeader}>
        <span className={styles.mockLogo}>Nexa Билтен</span>
        <span className={styles.mockDate}>{selectedMonth ? monthLabel(selectedMonth) : 'Месечно издание'}</span>
      </div>
      <div className={styles.mockArticle}>
        <div className={styles.mockTitleBar} />
        <div className={styles.mockLine} />
        <div className={styles.mockLine} style={{ width: '86%' }} />
        <div className={styles.mockLine} style={{ width: '62%' }} />
      </div>
      <Slot n={1} />
      <div className={styles.mockArticle}>
        <div className={styles.mockTitleBar} style={{ width: '55%' }} />
        <div className={styles.mockLine} />
        <div className={styles.mockLine} style={{ width: '74%' }} />
      </div>
      <Slot n={2} />
      <div className={styles.mockArticle}>
        <div className={styles.mockTitleBar} style={{ width: '48%' }} />
        <div className={styles.mockLine} style={{ width: '90%' }} />
        <div className={styles.mockLine} style={{ width: '68%' }} />
      </div>
      <Slot n={3} />
      <div className={styles.mockFooter}>nexa.mk · 1000+ претплатници</div>
    </div>
  );
}

export default function NewsletterAdBooking() {
  const { token } = useAuth();
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
  // Every send re-opens the terms modal: each banner is a fresh warranty of
  // marketing authority + IP rights, and each acceptance is appended to the
  // users.termsAcceptances audit trail with a timestamp.
  const [showTerms, setShowTerms] = useState(false);

  const [availability, setAvailability] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [quota, setQuota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false); // feature flag off → 404

  const [selectedMonth, setSelectedMonth] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dimWarning, setDimWarning] = useState(null);
  const [targetUrl, setTargetUrl] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      axios.get('/api/newsletter-ads/availability', auth),
      axios.get('/api/newsletter-ads/mine', auth)
    ]).then(([a, m]) => {
      setAvailability(a.data?.months || []);
      setBookings(m.data?.bookings || []);
      setQuota(m.data?.quota || []);
      setUnavailable(false);
    }).catch(e => {
      if (e.response?.status === 404) setUnavailable(true);
      else if (e.response?.status !== 402) setError(e.response?.data?.message || e.message);
    }).finally(() => setLoading(false));
  };

  useEffect(load, [auth]); // eslint-disable-line react-hooks/exhaustive-deps

  // Quota for the quarter of the selected (or first available) month.
  const currentQuota = useMemo(() => {
    if (!quota.length) return null;
    if (!selectedMonth) return quota[0];
    const q = `${selectedMonth.slice(0, 4)}-Q${Math.floor((Number(selectedMonth.slice(5)) - 1) / 3) + 1}`;
    return quota.find(x => x.quarterKey === q) || quota[0];
  }, [quota, selectedMonth]);

  const activeBooking = bookings.find(b => b.status === 'active');

  const handleFile = (f) => {
    setDimWarning(null);
    setError(null);
    if (!f) { setFile(null); setPreview(null); return; }
    if (!['image/jpeg', 'image/png'].includes(f.type)) {
      setError('Дозволени се само JPG или PNG слики.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('Сликата мора да биде до 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    const img = new Image();
    img.onload = () => {
      if (img.width < 400 || Math.abs(img.width / img.height - 3) > 1.2) {
        setDimWarning(`Вашата слика е ${img.width}×${img.height}px. Препорачано е 600×200px за најдобар изглед во email.`);
      }
    };
    img.src = url;
  };

  const onPickFile = (e) => handleFile(e.target.files?.[0]);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer?.files?.[0]);
  };

  const doBook = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('monthKey', selectedMonth);
      if (targetUrl.trim()) fd.append('targetUrl', targetUrl.trim());
      if (note.trim()) fd.append('note', note.trim());
      await axios.post('/api/newsletter-ads', fd, auth);
      setSuccess(selectedMonth);
      setFile(null); setPreview(null); setTargetUrl(''); setNote(''); setSelectedMonth(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      load();
    } catch (e) {
      if (e.response?.status !== 402) {
        setError(e.response?.data?.message || 'Резервацијата не успеа. Обидете се повторно.');
      }
      load(); // refresh availability — the slot may have just been taken
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!selectedMonth) { setError('Изберете месец за Вашиот банер.'); return; }
    if (!file) { setError('Прикачете слика за банерот (JPG или PNG).'); return; }
    setShowTerms(true);
  };

  const onAcceptTerms = async () => {
    setShowTerms(false);
    // Append this acceptance to the audit trail (fail-open — the user
    // consented in the UI; a record hiccup shouldn't block the booking).
    try {
      await axios.post('/api/terms/accept',
        { feature: 'newsletterAd', version: CURRENT_VERSIONS.newsletterAd || 1 }, auth);
    } catch (_) { /* non-blocking */ }
    doBook();
  };

  if (loading) return <div className={shared.spinner}>Се вчитува…</div>;

  if (unavailable) {
    return (
      <div className={shared.emptyState}>
        Резервацијата на банери во билтенот е наскоро достапна.
      </div>
    );
  }

  const quotaUsed = currentQuota ? currentQuota.used >= currentQuota.max : false;

  return (
    <div className={styles.wrap}>
      <section className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>Вашиот банер пред 1000+ претплатници</h1>
          <p className={styles.heroLead}>
            Секој месец Nexa испраќа билтен до над 1000 бизниси и професионалци.
            Како претплатник, еднаш квартално може да резервирате еден од трите
            банер слотови — без дополнителна доплата.
          </p>
          <ol className={styles.steps}>
            <li><strong>Изберете месец</strong> — со слободен слот (3 по билтен)</li>
            <li><strong>Прикачете банер</strong> — препорачано 600×200px, JPG/PNG</li>
            <li><strong>Ние го поставуваме</strong> — банерот излегува во билтенот за избраниот месец</li>
          </ol>
        </div>
        <NewsletterMockup availability={availability} selectedMonth={selectedMonth} />
      </section>

      {currentQuota && (
        <div className={`${styles.quotaPill} ${quotaUsed ? styles.quotaPillFull : ''}`}>
          Искористено: {currentQuota.used}/{currentQuota.max} за квартал {currentQuota.quarterKey.replace('-', ' ')}
        </div>
      )}

      {success && (
        <div className={shared.toastOk}>
          Банерот за {monthLabel(success)} е резервиран. Ќе го поставиме во билтенот — потврда и детали пристигнуваат на Вашиот email.
        </div>
      )}
      {error && <div className={shared.toastError}>{error}</div>}

      {activeBooking ? (
        <div className={styles.activeCard}>
          <div className={styles.activeCardHead}>Вашата активна резервација</div>
          <div className={styles.activeCardBody}>
            {activeBooking.imageUrl && (
              <img src={activeBooking.imageUrl} alt="Вашиот банер" className={styles.activeThumb} />
            )}
            <div>
              <div className={styles.activeMonth}>{monthLabel(activeBooking.monthKey)} · Слот {activeBooking.slotNumber}</div>
              <div className={styles.activeMeta}>Резервирано: {fmt(activeBooking.createdAt)}</div>
              {activeBooking.targetUrl && <div className={styles.activeMeta}>Линк: {activeBooking.targetUrl}</div>}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className={styles.form}>
          <div className={shared.field}>
            <span className={shared.label}>1. Изберете месец на билтенот</span>
            <div className={styles.monthGrid}>
              {availability.map(m => {
                const full = m.slotsFree === 0;
                const active = selectedMonth === m.monthKey;
                return (
                  <button
                    key={m.monthKey}
                    type="button"
                    disabled={full}
                    onClick={() => { setSelectedMonth(m.monthKey); setError(null); }}
                    className={`${styles.monthCard} ${active ? styles.monthCardActive : ''} ${full ? styles.monthCardFull : ''}`}
                  >
                    <span className={styles.monthName}>{monthLabel(m.monthKey)}</span>
                    <span className={styles.slotDots}>
                      {Array.from({ length: SLOTS_PER_MONTH }, (_, i) => (
                        <span key={i} className={`${styles.slotDot} ${i < m.slotsUsed ? styles.slotDotTaken : ''}`} />
                      ))}
                    </span>
                    {full && <span className={styles.monthStatus}>Пополнето</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={shared.field}>
            <span className={shared.label}>2. Прикачете банер</span>
            <div
              className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''} ${file ? styles.dropzoneHasFile : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" />
              </svg>
              <span className={styles.dropzoneTitle}>
                {file ? file.name : 'Повлечете ја сликата тука или кликнете за избор'}
              </span>
              <span className={styles.dropzoneHint}>Препорачано: 600×200px · JPG или PNG · до 5MB</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={onPickFile}
              style={{ display: 'none' }}
            />
            {dimWarning && <div className={styles.dimWarning}>{dimWarning}</div>}
            {preview && (
              <div className={styles.bannerPreview}>
                <span className={styles.bannerPreviewLabel}>Преглед — вака ќе изгледа во билтенот:</span>
                <img src={preview} alt="Преглед на банерот" />
              </div>
            )}
          </div>

          <div className={shared.field}>
            <span className={shared.label}>3. Линк на банерот (опционално)</span>
            <span className={shared.help}>Каде води кликот — на пр. Вашата веб-страница или понуда.</span>
            <input
              type="url"
              className={shared.input}
              placeholder="https://vashafirma.mk"
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className={shared.field}>
            <span className={shared.label}>Забелешка за нас (опционално)</span>
            <textarea
              className={shared.textarea}
              rows={2}
              placeholder="На пр. „банерот промовира нова услуга…“"
              value={note}
              onChange={e => setNote(e.target.value)}
              maxLength={300}
            />
          </div>

          <div className={shared.actionsRow}>
            <button type="submit" className={shared.btnPrimary} disabled={submitting || quotaUsed}>
              {submitting ? 'Се резервира…' : 'Резервирај слот'}
            </button>
            {quotaUsed && !activeBooking && (
              <span className={styles.quotaNote}>Квотата за овој квартал е искористена.</span>
            )}
          </div>
        </form>
      )}

      {bookings.length > 0 && (
        <div className={styles.history}>
          <div className={shared.sideCardHead}>Мои резервации</div>
          <div className={shared.list}>
            {bookings.map(b => (
              <div key={b._id} className={shared.row}>
                <div className={shared.rowMain}>
                  <div className={shared.rowTitle}>{monthLabel(b.monthKey)} · Слот {b.slotNumber}</div>
                  <div className={shared.rowMeta}>Резервирано: {fmt(b.createdAt)}</div>
                </div>
                {b.imageUrl && <img src={b.imageUrl} alt="" className={styles.historyThumb} />}
                <span className={`${shared.statusPill} ${b.status === 'active' ? shared.s_accepted : shared.s_draft}`}>
                  {b.status === 'active' ? 'Активна' : 'Откажана'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showTerms && (
        <FeatureTermsModal
          feature="newsletterAd"
          isOpen
          onAccept={onAcceptTerms}
          onDecline={() => setShowTerms(false)}
        />
      )}
    </div>
  );
}

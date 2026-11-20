import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import TrialDisabledNotice from '../../components/terminal/TrialDisabledNotice';
import ExpressInterestModal from '../../components/terminal/ExpressInterestModal';
import { isTrial, canExpressInterest, visibleTier, trialPreview, openSubscriptionGate } from '../../lib/tier';
import { CATEGORY_LABEL } from '../../config/inquiryCategories';
import CaseFunnel from '../../components/terminal/CaseFunnel';
import styles from './Inquiries.module.css';

// Sample cards used for the trial-period masked preview.
const SAMPLE_CARDS = [
  {
    _id: 'sample-1',
    topic: 'Сразмерен преглед — државјанство по потекло',
    summary: 'Граѓанин од Австралија со македонско потекло сака да аплицира за државјанство. Бара адвокат во Скопје.',
    city: 'Skopje', categories: ['citizenship'], language: 'mk',
    urgency: 'standard', status: 'open', postedAt: new Date().toISOString()
  },
  {
    _id: 'sample-2',
    topic: 'Сразмерен преглед — итна дозвола за престој',
    summary: 'Турски државјанин со склучен брак во Скопје. Бара дозвола за престој со рок од 2 недели.',
    city: 'Skopje', categories: ['residence'], language: 'tr',
    urgency: 'urgent', status: 'open', postedAt: new Date().toISOString()
  }
];

// Satellite sites that feed the case pool. Keep in sync with LeadsHome.
const CASE_SOURCES = [
  'samodaprasham.mk', 'immigration.mk', 'macedoniancitizenship.mk',
  'company.nexa.mk', 'iplaw.nexa.mk', 'osiguran.mk', 'properties.nexa.mk'
];

// Board filter: the two catch-all keys show as one „Друго" chip.
const OTHER = 'other';
const OTHER_KEYS = ['other_legal', 'legal_questions'];
const filterKey = (c) => (OTHER_KEYS.includes(c) ? OTHER : c);
const filterLabel = (k) => (k === OTHER ? 'Друго' : CATEGORY_LABEL[k]);

const fmt = (d) => d ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

// Macedonian counting plural: "1 ден" vs "2 дена".
const mkPlural = (n, one, few) => (n % 10 === 1 && n % 100 !== 11 ? one : few);

// Engaging relative time in Macedonian ("пред 3 дена"). Falls back to absolute
// only for anything implausibly old.
const timeAgo = (d) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60 * 1000) return 'штотуку';
  const min = Math.floor(diff / 60000);
  if (min < 60) return `пред ${min} ${mkPlural(min, 'минута', 'минути')}`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `пред ${hr} ${mkPlural(hr, 'час', 'часа')}`;
  const day = Math.floor(hr / 24);
  // Stay in days through the first two weeks so we never show "пред 1 недела".
  if (day < 14) return `пред ${day} ${mkPlural(day, 'ден', 'дена')}`;
  if (day < 35) { const w = Math.floor(day / 7); return `пред ${w} ${mkPlural(w, 'недела', 'недели')}`; }
  if (day < 365) { const mo = Math.floor(day / 30); return `пред ${mo} ${mkPlural(mo, 'месец', 'месеци')}`; }
  const yr = Math.floor(day / 365);
  return `пред ${yr} ${mkPlural(yr, 'година', 'години')}`;
};

// Per-card user status (computed from signal + approval state).
const ITEM_STATE = {
  OPEN:        { key: 'open',        label: 'Отворено',           cls: 's_open' },
  REQUESTED:   { key: 'requested',   label: 'Побаран ангажман',   cls: 's_requested' },
  APPROVED:    { key: 'approved',    label: 'Одобрен ангажман',   cls: 's_approved' },
  NOT_CHOSEN:  { key: 'not_chosen',  label: 'Не сте избрани',     cls: 's_not_chosen' }
};

// Compact "how it works" — line icons (no emojis).
// A lead older than this (ms) is visually muted as an "older case"; anything
// newer is highlighted with a colored "Ново" tag.
const OLD_LEAD_MS = 15 * 24 * 60 * 60 * 1000;
const isFresh = (postedAt) => postedAt && (Date.now() - new Date(postedAt).getTime() <= OLD_LEAD_MS);

export default function LeadsPage() {
  const { token, currentUser } = useAuth();
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const trial = isTrial(currentUser);
  const previewMode = trialPreview(currentUser); // trial: see real cards, blurred
  const vt = visibleTier(currentUser);
  const isMember = vt === 'B' || vt === 'ADMIN';

  const [board, setBoard] = useState([]);
  const [claims, setClaims] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalFor, setModalFor] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [catFilter, setCatFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!isMember && !previewMode) { setLoading(false); return () => { cancelled = true; }; }
    setLoading(true);
    const tasks = [
      axios.get('/api/inquiries', auth).then(r => r.data?.items || []).catch(() => [])
    ];
    // Trial preview only fetches the board — claims/engagements are
    // never created during trial since users can't submit interest.
    if (!previewMode) {
      tasks.push(
        axios.get('/api/my-claims',     auth).then(r => r.data?.items || []).catch(() => []),
        axios.get('/api/my-engagements',auth).then(r => r.data?.items || []).catch(() => [])
      );
    }
    Promise.all(tasks).then((results) => {
      if (cancelled) return;
      const [b, c = [], e = []] = results;
      // If the trial preview turns up nothing (clean DB / no inquiries yet),
      // fall back to sample cards so the user can see what the board looks like.
      setBoard(previewMode && b.length === 0 ? SAMPLE_CARDS : b);
      setClaims(c); setEngagements(e);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [trial, isMember, previewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Merge into a single per-inquiry view, annotated with the user's state.
  const items = useMemo(() => {
    const byId = new Map();
    board.forEach(inq => {
      byId.set(String(inq._id), { inquiry: inq, signal: null, approval: null, state: ITEM_STATE.OPEN });
    });
    claims.forEach(({ signal, inquiry }) => {
      const id = String(inquiry?._id || signal.inquiryId);
      const cur = byId.get(id) || { inquiry: inquiry || { _id: id, topic: '(избришано барање)' }, signal: null, approval: null };
      cur.signal = signal;
      // Decide state from signal status; approval below may override.
      if      (signal.status === 'pending')      cur.state = ITEM_STATE.REQUESTED;
      else if (signal.status === 'approved')     cur.state = ITEM_STATE.APPROVED;
      else if (signal.status === 'acknowledged') cur.state = ITEM_STATE.NOT_CHOSEN;
      byId.set(id, cur);
    });
    engagements.forEach(({ inquiry, approval }) => {
      const id = String(inquiry?._id || approval.inquiryId);
      const cur = byId.get(id) || { inquiry: inquiry || { _id: id, topic: '(избришано барање)' }, signal: null, approval: null };
      cur.approval = approval;
      cur.state = ITEM_STATE.APPROVED;
      // Use the merged inquiry doc which carries the contact info when approved.
      if (inquiry) cur.inquiry = { ...cur.inquiry, ...inquiry };
      byId.set(id, cur);
    });
    // Sort: approved → requested → open → not chosen, then by date desc.
    const order = { approved: 0, requested: 1, open: 2, not_chosen: 3 };
    return Array.from(byId.values()).sort((a, b) => {
      const oa = order[a.state.key] ?? 9, ob = order[b.state.key] ?? 9;
      if (oa !== ob) return oa - ob;
      const da = new Date(a.approval?.approvedAt || a.signal?.createdAt || a.inquiry?.postedAt || 0).getTime();
      const db = new Date(b.approval?.approvedAt || b.signal?.createdAt || b.inquiry?.postedAt || 0).getTime();
      return db - da;
    });
  }, [board, claims, engagements]);

  // Categories actually present on the board — drives the filter bar. We keep
  // only keys in the current taxonomy so legacy tags (e.g. 'legal') never show
  // up as dead filter chips. The two „Друго" keys collapse into one chip that
  // always sorts last. Each entry carries its live count (one per case).
  const availableCategories = useMemo(() => {
    const counts = new Map();
    items.forEach(it => {
      const keys = new Set((it.inquiry?.categories || []).filter(c => CATEGORY_LABEL[c]).map(filterKey));
      keys.forEach(k => counts.set(k, (counts.get(k) || 0) + 1));
    });
    return Array.from(counts.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => (a.key === OTHER) - (b.key === OTHER) || filterLabel(a.key).localeCompare(filterLabel(b.key), 'mk'));
  }, [items]);

  const visibleItems = useMemo(() => (
    catFilter ? items.filter(it => (it.inquiry?.categories || []).some(c => filterKey(c) === catFilter)) : items
  ), [items, catFilter]);

  const onExpress = (inq) => {
    if (trial) return;
    if (!canExpressInterest(currentUser).allowed) return;
    setModalFor(inq);
  };

  const submitInterest = async (payload) => {
    const res = await axios.post(`/api/inquiries/${modalFor._id}/interest`, payload, auth);
    setModalFor(null);
    setToast({ type: 'ok', text: 'Интересот е примен. Уредничкиот тим ќе одлучи.' });
    // Optimistically annotate this inquiry as REQUESTED.
    setClaims(prev => ([...prev, { signal: { _id: 'tmp-' + Date.now(), inquiryId: modalFor._id, status: 'pending', createdAt: new Date().toISOString() }, inquiry: modalFor }]));
    return res.data;
  };

  return (
    <TerminalShell>
      <div className={`${styles.page} ${styles.pageWide}`}>
        <header className={styles.header}>
          <CaseFunnel
            sources={CASE_SOURCES}
            categories={!loading && items.length > 0 ? availableCategories : []}
            active={catFilter}
            onSelect={setCatFilter}
            labelOf={filterLabel}
          />
        </header>

        {trial && <TrialDisabledNotice />}
        {!isMember && !trial && (
          <div className={styles.toastError}>Случаите се достапни за Про корисници.</div>
        )}
        {toast && <div className={toast.type === 'ok' ? styles.toastOk : styles.toastError}>{toast.text}</div>}
        {trial && (
          <div className={styles.sampleBanner}>
            Преглед — на пробната верзија гледате примерни картички. Активирајте план за пристап до вистинските барања.
          </div>
        )}

        {!loading && catFilter && (
          <div className={styles.resultBar}>
            <span className={styles.resultCount}>{filterLabel(catFilter)}</span>
            <button type="button" className={styles.clearFilter} onClick={() => setCatFilter('')}>
              Сите области ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className={styles.spinner}>Се вчитува…</div>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>Во моментов нема активни барања во Вашата област.</div>
        ) : visibleItems.length === 0 ? (
          <div className={styles.emptyState}>Нема барања во избраната категорија.</div>
        ) : (
          <div className={`${styles.list} ${styles.boardList}`}>
            {visibleItems.map(item => (
              <Card key={item.inquiry._id}
                    item={item}
                    sample={trial}
                    blurred={previewMode}
                    userCategories={currentUser?.superUser?.practiceAreas || []}
                    disabled={trial || !canExpressInterest(currentUser).allowed}
                    onExpress={() => onExpress(item.inquiry)}
                    onOpenDetail={() => {
                      if (previewMode) { openSubscriptionGate({ source: 'leads' }); return; }
                      setDetailItem(item);
                    }} />
            ))}
          </div>
        )}

        {detailItem && (
          <DetailModal
            item={detailItem}
            userCategories={currentUser?.superUser?.practiceAreas || []}
            disabled={trial || !canExpressInterest(currentUser).allowed}
            onExpress={() => { onExpress(detailItem.inquiry); setDetailItem(null); }}
            onClose={() => setDetailItem(null)}
          />
        )}

        {modalFor && (
          <ExpressInterestModal
            inquiry={modalFor}
            defaultProfession="lawyer"
            onClose={() => setModalFor(null)}
            onSubmit={submitInterest}
          />
        )}
      </div>
    </TerminalShell>
  );
}

function Card({ item, sample, blurred, userCategories, onOpenDetail }) {
  const { inquiry, state } = item;
  const isNew = isFresh(inquiry.postedAt);
  const isOld = inquiry.postedAt && !isNew;
  const isHit = (c) => userCategories?.includes(c);

  // Trial-preview card: the whole card is a clickable overlay that opens
  // the order modal. Body content stays visible but heavily blurred.
  if (blurred) {
    return (
      <div className={`${styles.card} ${styles.previewCard}`}
           role="button" tabIndex={0}
           onClick={onOpenDetail}
           onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenDetail(); }}>
        <div className={styles.cardHead}>
          <div className={styles.cardTitle}>{inquiry.topic || '(без наслов)'}</div>
          {isNew && <span className={styles.chipNew}>Ново</span>}
          {inquiry.urgency === 'urgent' && <span className={styles.chipUrgent}>Итно</span>}
          <span className={`${styles.statusPill} ${styles[state.cls]}`}>{state.label}</span>
        </div>
        <div className={styles.previewBlur}>
          {inquiry.summary && <div className={styles.cardSummaryClamp}>{inquiry.summary}</div>}
          {(inquiry.categories || []).length > 0 && (
            <div className={styles.chipsRow}>
              {inquiry.categories.slice(0, 3).map(c => (
                <span key={c} className={styles.chip}>{CATEGORY_LABEL[c] || c}</span>
              ))}
            </div>
          )}
          <div className={styles.cardMeta}>
            {inquiry.language && <span className={styles.cardMetaItem}>🗣 {inquiry.language?.toUpperCase()}</span>}
            {inquiry.postedAt && <span className={styles.cardMetaItem} title={fmt(inquiry.postedAt)}>📅 {timeAgo(inquiry.postedAt)}</span>}
          </div>
        </div>
        <div className={styles.previewOverlay}>
          <span className={styles.previewBadge}>🔒 Активирајте план за пристап</span>
        </div>
      </div>
    );
  }

  const accent = inquiry.urgency === 'urgent'
    ? styles.cardAccentUrgent
    : (isNew ? styles.cardAccentNew : '');

  return (
    <div className={`${styles.card} ${styles.cardClickable} ${accent} ${sample ? styles.sample : ''} ${isOld ? styles.cardOld : ''}`}
         role="button" tabIndex={0}
         onClick={onOpenDetail}
         onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenDetail(); } }}>
      <div className={styles.cardHead}>
        <div className={styles.cardTitle}>{inquiry.topic || '(без наслов)'}</div>
        <span className={`${styles.statusPill} ${styles[state.cls]}`}>{state.label}</span>
      </div>

      {(isNew || inquiry.urgency === 'urgent') && (
        <div className={styles.cardAccents}>
          {isNew && <span className={styles.chipNew}>Ново</span>}
          {inquiry.urgency === 'urgent' && <span className={styles.chipUrgent}>Итно</span>}
        </div>
      )}

      {inquiry.summary && (
        <div className={styles.cardSummaryFade}>
          <div className={styles.cardSummaryClamp}>{inquiry.summary}</div>
        </div>
      )}

      {(inquiry.categories || []).length > 0 && (
        <div className={styles.chipsRow}>
          {inquiry.categories.slice(0, 3).map(c => (
            <span key={c} className={`${styles.chip} ${isHit(c) ? styles.chipHit : ''}`}>
              {CATEGORY_LABEL[c] || c}
            </span>
          ))}
        </div>
      )}

      {inquiry.procedure?.suggestions?.length > 0 && (
        <div className={styles.procedureHint}>
          {inquiry.procedure.label && <span className={styles.procedureTag}>{inquiry.procedure.label}</span>}
          <span className={styles.procedureHintText}>{inquiry.procedure.suggestions[0].text}</span>
        </div>
      )}

      <div className={styles.cardMeta}>
        {inquiry.language && <span className={styles.cardMetaItem}>🗣 {inquiry.language?.toUpperCase()}</span>}
        {inquiry.postedAt && <span className={styles.cardMetaItem} title={fmt(inquiry.postedAt)}>📅 {timeAgo(inquiry.postedAt)}</span>}
        <span className={styles.cardOpenCue}>Отвори →</span>
      </div>
    </div>
  );
}

function DetailModal({ item, userCategories, disabled, onExpress, onClose }) {
  const { inquiry, signal, approval, state } = item;
  const isNew = isFresh(inquiry.postedAt);
  const isHit = (c) => userCategories?.includes(c);
  const showActionButton = state.key === 'open';
  const showContact = state.key === 'approved' && (inquiry.inquirerName || inquiry.inquirerEmail || inquiry.inquirerPhone);

  return (
    <div className={styles.detailBackdrop} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.detailClose} onClick={onClose} aria-label="Затвори">×</button>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          {isNew && <span className={styles.chipNew}>Ново</span>}
          {inquiry.urgency === 'urgent' && <span className={styles.chipUrgent}>Итно</span>}
          <span className={`${styles.statusPill} ${styles[state.cls]}`}>{state.label}</span>
        </div>

        <h2 className={styles.detailTitle}>{inquiry.topic || '(без наслов)'}</h2>

        {(inquiry.categories || []).length > 0 && (
          <div className={styles.chipsRow}>
            {inquiry.categories.map(c => (
              <span key={c} className={`${styles.chip} ${isHit(c) ? styles.chipHit : ''}`}>
                {CATEGORY_LABEL[c] || c}
              </span>
            ))}
          </div>
        )}

        {inquiry.summary && <p className={styles.detailSummary}>{inquiry.summary}</p>}

        {inquiry.procedure?.suggestions?.length > 0 && (
          <div className={styles.procedureBlock}>
            {inquiry.procedure.label && (
              <div className={styles.procedureBlockHead}>
                <span className={styles.procedureTag}>{inquiry.procedure.label}</span>
                <span className={styles.procedureBlockCaption}>Поврзана постапка — можеби е релевантна за вашата услуга</span>
              </div>
            )}
            <ul className={styles.procedureList}>
              {inquiry.procedure.suggestions.map((s, i) => (
                <li key={i} className={s.isPrimary ? styles.procedurePrimary : ''}>{s.text}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.detailMeta}>
          {inquiry.language && <span>🗣 {inquiry.language?.toUpperCase()}</span>}
          {inquiry.postedAt && <span title={fmt(inquiry.postedAt)}>📅 Објавено: {timeAgo(inquiry.postedAt)}</span>}
          {signal?.createdAt && state.key === 'requested' && <span title={fmt(signal.createdAt)}>Побарано: {timeAgo(signal.createdAt)}</span>}
          {approval?.approvedAt && <span title={fmt(approval.approvedAt)}>Одобрено: {timeAgo(approval.approvedAt)}</span>}
        </div>

        {showContact && (
          <div className={styles.panel} style={{ background: '#f8fafc', margin: '0 0 14px' }}>
            <div className={styles.panelHead}>Контакт на клиентот</div>
            <div className={styles.kv}>
              <div className={styles.kvK}>Име</div><div className={styles.kvV}>{inquiry.inquirerName || '—'}</div>
              <div className={styles.kvK}>Е-пошта</div><div className={styles.kvV}>{inquiry.inquirerEmail || '—'}</div>
              <div className={styles.kvK}>Телефон</div><div className={styles.kvV}>{inquiry.inquirerPhone || '—'}</div>
            </div>
          </div>
        )}

        <div className={styles.detailActions}>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>Затвори</button>
          {showActionButton && (
            <button type="button" className={styles.btnPrimary} disabled={disabled} onClick={onExpress}>
              Изразувам интерес
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import TrialDisabledNotice from '../../components/terminal/TrialDisabledNotice';
import ExpressInterestModal from '../../components/terminal/ExpressInterestModal';
import FeatureTermsModal from '../../components/terminal/FeatureTermsModal';
import useTermsGate from '../../hooks/useTermsGate';
import { isTrial, canExpressInterest, visibleTier, trialPreview, openSubscriptionGate } from '../../lib/tier';
import styles from './Inquiries.module.css';

// Sample cards used for the trial-period masked preview.
const SAMPLE_CARDS = [
  {
    _id: 'sample-1',
    topic: 'Сразмерен преглед — државјанство по потекло',
    summary: 'Граѓанин од Австралија со македонско потекло сака да аплицира за државјанство. Бара адвокат во Скопје.',
    city: 'Skopje', categories: ['legal', 'translation'], language: 'mk',
    urgency: 'standard', status: 'open', postedAt: new Date().toISOString()
  },
  {
    _id: 'sample-2',
    topic: 'Сразмерен преглед — итна дозвола за престој',
    summary: 'Турски државјанин со склучен брак во Скопје. Бара дозвола за престој со рок од 2 недели.',
    city: 'Skopje', categories: ['legal'], language: 'tr',
    urgency: 'urgent', status: 'open', postedAt: new Date().toISOString()
  }
];

const CATEGORY_LABEL = {
  legal: 'Правен', accounting: 'Сметководство', tax: 'Даноци', insurance: 'Осигурување',
  real_estate: 'Недвижности', hr: 'HR', marketing: 'Маркетинг', translation: 'Превод', other: 'Друго'
};
const fmt = (d) => d ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

// Per-card user status (computed from signal + approval state).
const ITEM_STATE = {
  OPEN:        { key: 'open',        label: 'Отворено',           cls: 's_open' },
  REQUESTED:   { key: 'requested',   label: 'Побаран ангажман',   cls: 's_requested' },
  APPROVED:    { key: 'approved',    label: 'Одобрен ангажман',   cls: 's_approved' },
  NOT_CHOSEN:  { key: 'not_chosen',  label: 'Не сте избрани',     cls: 's_not_chosen' }
};

// Compact "how it works" — line icons (no emojis).
const lSvg = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const IconFlag = () => (<svg {...lSvg}><path d="M4 21V4" /><path d="M4 4h13l-2 4 2 4H4" /></svg>);
const IconFunnel = () => (<svg {...lSvg}><path d="M3 4h18l-7 8v6l-4 2v-8z" /></svg>);
const IconMail = () => (<svg {...lSvg}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>);

const FlowStep = ({ n, icon, title, desc }) => (
  <div className={styles.leadsFlowStep}>
    <span className={styles.leadsFlowIcon} aria-hidden>
      {icon}
      <span className={styles.leadsFlowNum}>{n}</span>
    </span>
    <span className={styles.leadsFlowTitle}>{title}</span>
    <span className={styles.leadsFlowDesc}>{desc}</span>
  </div>
);

// A lead older than this (ms) is visually muted as an "older case".
const OLD_LEAD_MS = 7 * 24 * 60 * 60 * 1000;

export default function LeadsPage() {
  const { token, currentUser } = useAuth();
  const { requireTerms, termsModal } = useTermsGate();
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

  const onExpress = (inq) => {
    if (trial) return;
    if (!canExpressInterest(currentUser).allowed) return;
    requireTerms('case', () => setModalFor(inq));
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
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Случаи</span>

          <div className={styles.leadsIntro}>
            <p className={styles.leadsIntroLead}>
              Анонимизирани барања од клиенти преку Nexa сателитските сајтови — само
              серозни, филтрирани случаи кои одговараат на Вашата практика.
            </p>
            <div className={styles.leadsFlow}>
              <FlowStep n={1} icon={<IconFlag />} title="Изразете интерес"
                desc="Означувате дека сакате да го преземете случајот." />
              <FlowStep n={2} icon={<IconFunnel />} title="Уредничка квалификација"
                desc="Nexa го проверува и филтрира барањето." />
              <FlowStep n={3} icon={<IconMail />} title="Добивте го контактот"
                desc="По одобрување, го добивате контактот на клиентот." />
            </div>
            <div className={styles.commercialSources}>
              <span className={styles.commercialSourcesLabel}>Извори:</span>
              <a href="https://samodaprasham.mk"        target="_blank" rel="noopener noreferrer" className={styles.commercialSourceLink}>samodaprasham.mk</a>
              <a href="https://immigration.mk"          target="_blank" rel="noopener noreferrer" className={styles.commercialSourceLink}>immigration.mk</a>
              <a href="https://macedoniancitizenship.mk" target="_blank" rel="noopener noreferrer" className={styles.commercialSourceLink}>macedoniancitizenship.mk</a>
              <a href="https://company.nexa.mk"         target="_blank" rel="noopener noreferrer" className={styles.commercialSourceLink}>company.nexa.mk</a>
              <a href="https://iplaw.nexa.mk"           target="_blank" rel="noopener noreferrer" className={styles.commercialSourceLink}>iplaw.nexa.mk</a>
            </div>
          </div>
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

        {loading ? (
          <div className={styles.spinner}>Се вчитува…</div>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>Во моментов нема активни барања во Вашата област.</div>
        ) : (
          <div className={styles.list}>
            {items.map(item => (
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

        {termsModal && <FeatureTermsModal {...termsModal} />}
      </div>
    </TerminalShell>
  );
}

function Card({ item, sample, blurred, userCategories, onOpenDetail }) {
  const { inquiry, state } = item;
  const isOld = inquiry.postedAt && (Date.now() - new Date(inquiry.postedAt).getTime() > OLD_LEAD_MS);
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
            {inquiry.postedAt && <span className={styles.cardMetaItem}>📅 {fmt(inquiry.postedAt)}</span>}
          </div>
        </div>
        <div className={styles.previewOverlay}>
          <span className={styles.previewBadge}>🔒 Активирајте план за пристап</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${sample ? styles.sample : ''} ${isOld ? styles.cardOld : ''}`}>
      <div className={styles.cardHead}>
        <div className={styles.cardTitle}>{inquiry.topic || '(без наслов)'}</div>
        {inquiry.urgency === 'urgent' && <span className={styles.chipUrgent}>Итно</span>}
        <span className={`${styles.statusPill} ${styles[state.cls]}`}>{state.label}</span>
      </div>

      {inquiry.summary && (
        <>
          <div className={styles.cardSummaryClamp}>{inquiry.summary}</div>
          <button type="button" className={styles.readMoreLink} onClick={onOpenDetail}>
            Прочитај повеќе →
          </button>
        </>
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

      <div className={styles.cardMeta}>
        {inquiry.language && <span className={styles.cardMetaItem}>🗣 {inquiry.language?.toUpperCase()}</span>}
        {inquiry.postedAt && <span className={styles.cardMetaItem}>📅 {fmt(inquiry.postedAt)}</span>}
      </div>
    </div>
  );
}

function DetailModal({ item, userCategories, disabled, onExpress, onClose }) {
  const { inquiry, signal, approval, state } = item;
  const isHit = (c) => userCategories?.includes(c);
  const showActionButton = state.key === 'open';
  const showContact = state.key === 'approved' && (inquiry.inquirerName || inquiry.inquirerEmail || inquiry.inquirerPhone);

  return (
    <div className={styles.detailBackdrop} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.detailClose} onClick={onClose} aria-label="Затвори">×</button>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
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

        <div className={styles.detailMeta}>
          {inquiry.language && <span>🗣 {inquiry.language?.toUpperCase()}</span>}
          {inquiry.postedAt && <span>📅 Објавено: {fmt(inquiry.postedAt)}</span>}
          {signal?.createdAt && state.key === 'requested' && <span>Побарано: {fmt(signal.createdAt)}</span>}
          {approval?.approvedAt && <span>Одобрено: {fmt(approval.approvedAt)}</span>}
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

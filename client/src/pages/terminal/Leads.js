import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import TrialDisabledNotice from '../../components/terminal/TrialDisabledNotice';
import ExpressInterestModal from '../../components/terminal/ExpressInterestModal';
import { isTrial, canExpressInterest, visibleTier } from '../../lib/tier';
import styles from './Inquiries.module.css';

// Sample cards used for the trial-period masked preview.
const SAMPLE_CARDS = [
  {
    _id: 'sample-1',
    topic: 'Сразмерен преглед — државјанство по потекло',
    summary: 'Граѓанин од Австралија со македонско потекло сака да аплицира за државјанство. Бара адвокат во Скопје.',
    city: 'Skopje',
    categories: ['legal', 'translation'],
    language: 'mk',
    urgency: 'standard',
    status: 'open',
    postedAt: new Date().toISOString()
  },
  {
    _id: 'sample-2',
    topic: 'Сразмерен преглед — итна дозвола за престој',
    summary: 'Турски државјанин со склучен брак во Скопје. Бара дозвола за престој со рок од 2 недели.',
    city: 'Skopje',
    categories: ['legal'],
    language: 'tr',
    urgency: 'urgent',
    status: 'open',
    postedAt: new Date().toISOString()
  }
];

const CATEGORY_LABEL = {
  legal: 'Правен', accounting: 'Сметководство', tax: 'Даноци', insurance: 'Осигурување',
  real_estate: 'Недвижности', hr: 'HR', marketing: 'Маркетинг', translation: 'Превод', other: 'Друго'
};
const STATUS_LABEL = {
  open: 'Отворено', interest_received: 'Има интерес',
  partially_claimed: 'Делумно зафатено', claimed: 'Зафатено', closed: 'Затворено'
};
const SIGNAL_LABEL = {
  pending: 'Чека одлука', approved: 'Одобрено', acknowledged: 'Не сте избрани'
};
const fmt = (d) => d ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export default function LeadsPage() {
  const { token, currentUser } = useAuth();
  const [params] = useSearchParams();
  const tab = params.get('tab') || 'board';
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const trial = isTrial(currentUser);
  const vt = visibleTier(currentUser);
  const isMember = vt === 'B' || vt === 'C' || vt === 'ADMIN';

  const [board, setBoard] = useState([]);
  const [claims, setClaims] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalFor, setModalFor] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const url = tab === 'claims'      ? '/api/my-claims'
              : tab === 'engagements' ? '/api/my-engagements'
              :                         '/api/inquiries';
    if (trial && tab === 'board') {
      // Don't hit the server at all for trial-on-board; render sample cards.
      if (!cancelled) { setBoard(SAMPLE_CARDS); setLoading(false); }
      return () => { cancelled = true; };
    }
    if (!isMember) {
      if (!cancelled) { setLoading(false); }
      return () => { cancelled = true; };
    }
    axios.get(url, auth)
      .then(res => {
        if (cancelled) return;
        if      (tab === 'claims')      setClaims(res.data?.items || []);
        else if (tab === 'engagements') setEngagements(res.data?.items || []);
        else                            setBoard(res.data?.items || []);
      })
      .catch(e => { if (!cancelled) setToast({ type: 'error', text: e.response?.data?.message || e.message }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tab, trial, isMember]); // eslint-disable-line react-hooks/exhaustive-deps

  const onExpress = (inq) => {
    if (trial) return;
    if (!canExpressInterest(currentUser).allowed) return;
    setModalFor(inq);
  };

  const submitInterest = async (payload) => {
    const res = await axios.post(`/api/inquiries/${modalFor._id}/interest`, payload, auth);
    setModalFor(null);
    setToast({ type: 'ok', text: 'Интересот е примен. Уредничкиот тим ќе одлучи.' });
    return res.data;
  };

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Барања</span>
          <h1 className={styles.title}>Интерна табла на барања</h1>
          <p className={styles.lead}>
            Анонимизирани барања кои стигнуваат преку Nexa сателитските сајтови.
            Изразете интерес за оние во кои можете да помогнете; уредничкиот тим
            одлучува кого да поврзе со клиентот.
          </p>
        </header>

        <nav className={styles.tabs}>
          <Link to="/terminal/leads"                  className={`${styles.tab} ${tab === 'board'       ? styles.tabActive : ''}`}>Интерна табла</Link>
          <Link to="/terminal/leads?tab=claims"       className={`${styles.tab} ${tab === 'claims'      ? styles.tabActive : ''}`}>Мои изразени интереси</Link>
          <Link to="/terminal/leads?tab=engagements"  className={`${styles.tab} ${tab === 'engagements' ? styles.tabActive : ''}`}>Мои ангажмани</Link>
        </nav>

        {trial && <TrialDisabledNotice />}
        {!isMember && !trial && (
          <div className={styles.toastError}>Барањата се достапни за Nexa Мрежа · Кантора и Студио корисници.</div>
        )}
        {toast && <div className={toast.type === 'ok' ? styles.toastOk : styles.toastError}>{toast.text}</div>}
        {trial && tab === 'board' && (
          <div className={styles.sampleBanner}>
            Преглед — на пробната верзија гледате примерни картички. Активирајте план за пристап до вистинските барања.
          </div>
        )}

        {loading ? (
          <div className={styles.spinner}>Се вчитува…</div>
        ) : tab === 'board' ? (
          board.length === 0 ? (
            <div className={styles.emptyState}>Во моментов нема активни барања во Вашата област.</div>
          ) : (
            <div className={styles.list}>
              {board.map(inq => (
                <BoardCard key={inq._id} inquiry={inq}
                           sample={trial}
                           userCategories={currentUser?.superUser?.practiceAreas || []}
                           disabled={trial || !canExpressInterest(currentUser).allowed}
                           onExpress={() => onExpress(inq)} />
              ))}
            </div>
          )
        ) : tab === 'claims' ? (
          claims.length === 0 ? (
            <div className={styles.emptyState}>Сè уште нема изразени интереси.</div>
          ) : (
            <div className={styles.list}>
              {claims.map(({ signal, inquiry }) => (
                <div key={signal._id} className={styles.card}>
                  <div className={styles.cardHead}>
                    <div className={styles.cardTitle}>{inquiry?.topic || '(избришано барање)'}</div>
                    <span className={`${styles.signalStatus} ${styles['sig' + signal.status.charAt(0).toUpperCase() + signal.status.slice(1)]}`}>
                      {SIGNAL_LABEL[signal.status]}
                    </span>
                  </div>
                  <div className={styles.cardSummary}>{inquiry?.summary}</div>
                  <div className={styles.cardMeta}>
                    <span>Поднесено: {fmt(signal.createdAt)}</span>
                    {signal.decidedAt && <span>Одлучено: {fmt(signal.decidedAt)}</span>}
                    {inquiry && <span>Град: {inquiry.city}</span>}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : engagements.length === 0 ? (
          <div className={styles.emptyState}>Сè уште нема одобрени ангажмани.</div>
        ) : (
          <div className={styles.list}>
            {engagements.map(({ inquiry, approval }) => (
              <div key={approval._id} className={styles.card}>
                <div className={styles.cardHead}>
                  <div className={styles.cardTitle}>{inquiry?.topic}</div>
                  <span className={`${styles.signalStatus} ${styles.sigApproved}`}>Одобрено</span>
                </div>
                <div className={styles.cardSummary}>{inquiry?.summary}</div>
                <div className={styles.panel} style={{ background: '#f8fafc' }}>
                  <div className={styles.panelHead}>Контакт на клиентот</div>
                  <div className={styles.kv}>
                    <div className={styles.kvK}>Име</div><div className={styles.kvV}>{inquiry?.inquirerName || '—'}</div><div />
                    <div className={styles.kvK}>Е-пошта</div><div className={styles.kvV}>{inquiry?.inquirerEmail || '—'}</div><div />
                    <div className={styles.kvK}>Телефон</div><div className={styles.kvV}>{inquiry?.inquirerPhone || '—'}</div><div />
                  </div>
                </div>
                <div className={styles.cardMeta}>
                  <span>Одобрено: {fmt(approval.approvedAt)}</span>
                  <span>Категорија: {CATEGORY_LABEL[approval.category] || approval.category}</span>
                  {approval.introducedAt && <span>Воведено: {fmt(approval.introducedAt)}</span>}
                </div>
              </div>
            ))}
          </div>
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

function BoardCard({ inquiry, sample, userCategories, disabled, onExpress }) {
  const isHit = (c) => userCategories?.includes(c);
  return (
    <div className={`${styles.card} ${sample ? styles.sample : ''}`}>
      <div className={styles.cardHead}>
        <div className={styles.cardTitle}>{inquiry.topic}</div>
        {inquiry.urgency === 'urgent' && <span className={styles.chipUrgent}>Итно</span>}
        <span className={`${styles.statusPill} ${styles['s_' + inquiry.status]}`}>
          {STATUS_LABEL[inquiry.status] || inquiry.status}
        </span>
      </div>
      <div className={styles.cardSummary}>{inquiry.summary}</div>
      <div className={styles.chipsRow}>
        {(inquiry.categories || []).map(c => (
          <span key={c} className={`${styles.chip} ${isHit(c) ? styles.chipHit : ''}`}>
            {CATEGORY_LABEL[c] || c}
          </span>
        ))}
      </div>
      <div className={styles.cardMeta}>
        <span className={styles.cardMetaItem}>📍 {inquiry.city}</span>
        <span className={styles.cardMetaItem}>🗣 {inquiry.language?.toUpperCase()}</span>
        <span className={styles.cardMetaItem}>📅 {fmt(inquiry.postedAt)}</span>
        <span style={{ flex: 1 }} />
        <button type="button" className={styles.btnPrimary} disabled={disabled} onClick={onExpress}>
          Изразувам интерес
        </button>
      </div>
    </div>
  );
}

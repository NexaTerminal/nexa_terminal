import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import TrialDisabledNotice from '../../components/terminal/TrialDisabledNotice';
import RequestTopicModal from '../../components/terminal/RequestTopicModal';
import FeatureTermsModal from '../../components/terminal/FeatureTermsModal';
import useTermsGate from '../../hooks/useTermsGate';
import { isTrial, canRequestQATopic, visibleTier, openSubscriptionGate } from '../../lib/tier';
import styles from './Topics.module.css';

const STATUS_LABEL = {
  requested:   'Барање за одобрување',
  in_progress: 'Во работа',
  submitted:   'Поднесено за преглед',
  returned:    'Вратено на доработка',
  accepted:    'Прифатено',
  published:   'Објавено',
  rejected:    'Одбиено',
  declined:    'Одбиено барање',
  released:    'Ослободено'
};
const fmt = (d) => d ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

// Flow + meta line icons (no emojis).
const tSvg = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const IconTarget = () => (<svg {...tSvg}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /></svg>);
const IconWrite = () => (<svg {...tSvg}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>);
const IconReview = () => (<svg {...tSvg}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1" /><path d="M8.5 13l2 2 4.5-4.5" /></svg>);
const IconPublish = () => (<svg {...tSvg}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" /></svg>);

const mSvg = { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
const MetaTag = () => (<svg {...mSvg}><path d="M5 9h14M5 15h14M10 3 8 21M16 3l-2 18" /></svg>);
const MetaLen = () => (<svg {...mSvg}><path d="M4 7h16M4 12h11M4 17h16" /></svg>);
const MetaClock = () => (<svg {...mSvg}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
const MetaList = () => (<svg {...mSvg}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>);

const FlowStep = ({ n, icon, title, desc }) => (
  <div className={styles.flowStep}>
    <span className={styles.flowIcon} aria-hidden>{icon}<span className={styles.flowNum}>{n}</span></span>
    <span className={styles.flowTitle}>{title}</span>
    <span className={styles.flowDesc}>{desc}</span>
  </div>
);

export default function TopicsQAPage() {
  const { token, currentUser } = useAuth();
  const { requireTerms, termsModal } = useTermsGate();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tab = params.get('tab') || 'open';
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const trial = isTrial(currentUser);
  const vt = visibleTier(currentUser);
  const visible = vt === 'C' || vt === 'ADMIN';

  const [worklist, setWorklist] = useState([]);
  const [mine, setMine] = useState([]);
  const [published, setPublished] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalFor, setModalFor] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!visible) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    const url = tab === 'mine'      ? '/api/topics/submissions'
              : tab === 'published' ? '/api/topics/published-mine'
              :                       '/api/topics/worklist';
    axios.get(url, auth)
      .then(res => {
        if (cancelled) return;
        if      (tab === 'mine')      setMine(res.data?.items || []);
        else if (tab === 'published') setPublished(res.data?.items || []);
        else                          setWorklist(res.data?.items || []);
      })
      .catch(e => { if (!cancelled) setToast({ type: 'error', text: e.response?.data?.message || e.message }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tab, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRequest = (topic) => {
    const check = canRequestQATopic(currentUser);
    if (!check.allowed) {
      // Trial or non-C → open the order modal so the user can subscribe.
      openSubscriptionGate({ source: 'topics-qa', reason: check.reason });
      return;
    }
    requireTerms('topic', () => setModalFor(topic));
  };

  const submitRequest = async ({ requestReason }) => {
    const res = await axios.post(`/api/topics/worklist/${modalFor._id}/request`, { requestReason }, auth);
    setModalFor(null);
    setToast({ type: 'ok', text: 'Барањето е поднесено. Ќе бидете известени по одобрување.' });
    navigate(`/terminal/topics-qa/answer/${res.data?.submission?._id}`);
  };

  if (!visible && !trial) {
    return (
      <TerminalShell>
        <div className={styles.page}>
          <div className={styles.emptyState}>
            Topics Q&A е достапно само за Ултра членови.
          </div>
        </div>
      </TerminalShell>
    );
  }

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Topics Q&A</span>
          <h1 className={styles.title}>Авторска работна табла</h1>
          <p className={styles.lead}>
            Пишувате експертски одговори на структурирани, SEO-таргетирани прашања и
            ги објавувате на topics.nexa.mk под Ваше име. Вие го носите стручното знаење,
            а уредничкиот тим се грижи за структурата и видливоста — така градите
            авторитет и Ве пронаоѓаат клиенти кои бараат специјалист.
          </p>

          <div className={styles.howBand}>
            <div className={styles.flow}>
              <FlowStep n={1} icon={<IconTarget />} title="Изберете тема"
                desc="Структурирани, SEO-таргетирани теми од Вашата област." />
              <FlowStep n={2} icon={<IconWrite />} title="Напишете одговор"
                desc="Одговарате на зададените прашања со Вашето знаење." />
              <FlowStep n={3} icon={<IconReview />} title="Уреднички преглед"
                desc="Уредникот прегледува; ако треба, бара доработка." />
              <FlowStep n={4} icon={<IconPublish />} title="Објавено под Ваше име"
                desc="Прилогот излегува на topics.nexa.mk со Вашиот потпис." />
            </div>
          </div>
        </header>

        <nav className={styles.tabs}>
          <Link to="/terminal/topics-qa"                 className={`${styles.tab} ${tab === 'open'      ? styles.tabActive : ''}`}>Отворени прашања</Link>
          <Link to="/terminal/topics-qa?tab=mine"        className={`${styles.tab} ${tab === 'mine'      ? styles.tabActive : ''}`}>Мои одговори</Link>
          <Link to="/terminal/topics-qa?tab=published"   className={`${styles.tab} ${tab === 'published' ? styles.tabActive : ''}`}>Објавени</Link>
        </nav>

        {trial && <TrialDisabledNotice />}
        {toast && <div className={toast.type === 'ok' ? styles.toastOk : styles.toastError}>{toast.text}</div>}

        {loading ? (
          <div className={styles.spinner}>Се вчитува…</div>
        ) : tab === 'open' ? (
          worklist.length === 0 ? (
            <div className={styles.emptyState}>Во моментов нема отворени теми во Вашата област.</div>
          ) : (
            <div className={styles.list}>
              {worklist.map(t => (
                <div key={t._id} className={styles.card}>
                  <div className={styles.cardHead}>
                    <div className={styles.cardTitle}>{t.title}</div>
                    <span className={styles.chip}>{t.practiceArea}</span>
                    {t.category && <span className={styles.chip}>{t.category}</span>}
                  </div>
                  <div className={styles.cardScope}>{t.scope}</div>
                  <div className={styles.cardMeta}>
                    <span className={styles.metaItem}><MetaTag /> {t.targetKeyword || '—'}</span>
                    <span className={styles.metaItem}><MetaLen /> ~{t.targetLengthWords} зборови</span>
                    <span className={styles.metaItem}><MetaClock /> Мек рок: {t.softDeadlineDays} дена</span>
                    <span className={styles.metaItem}><MetaList /> {(t.questions || []).length} прашања</span>
                  </div>
                  <div className={styles.cardRow}>
                    <span style={{ flex: 1 }} />
                    <button type="button" className={styles.btnPrimary}
                            onClick={() => onRequest(t)}>
                      Побарајте отворање
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : tab === 'mine' ? (
          mine.length === 0 ? (
            <div className={styles.emptyState}>Сè уште нема Ваши одговори.</div>
          ) : (
            <div className={styles.list}>
              {mine.map(({ submission, worklist: wl }) => (
                <Link key={submission._id} to={`/terminal/topics-qa/answer/${submission._id}`} className={styles.card}>
                  <div className={styles.cardHead}>
                    <div className={styles.cardTitle}>{wl?.title || '(избришана тема)'}</div>
                    <span className={`${styles.statusPill} ${styles['s_' + submission.status]}`}>
                      {STATUS_LABEL[submission.status]}
                    </span>
                  </div>
                  <div className={styles.cardScope}>{wl?.scope}</div>
                  <div className={styles.cardMeta}>
                    <span>Барано: {fmt(submission.requestedAt)}</span>
                    {submission.submittedAt && <span>Поднесено: {fmt(submission.submittedAt)}</span>}
                    {submission.revisions?.length > 0 && <span>Доработки: {submission.revisions.length}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : published.length === 0 ? (
          <div className={styles.emptyState}>Сè уште нема објавени Q&A прилози.</div>
        ) : (
          <div className={styles.list}>
            {published.map(p => (
              <a key={p._id} href={p.publishedUrl} target="_blank" rel="noopener" className={styles.card}>
                <div className={styles.cardHead}>
                  <div className={styles.cardTitle}>{p.publishedUrl}</div>
                  <span className={`${styles.statusPill} ${styles.s_published}`}>Објавено</span>
                </div>
                <div className={styles.cardMeta}>
                  <span>Објавено: {fmt(p.publishedAt)}</span>
                </div>
              </a>
            ))}
          </div>
        )}

        {modalFor && (
          <RequestTopicModal
            topic={modalFor}
            onClose={() => setModalFor(null)}
            onSubmit={submitRequest}
          />
        )}

        {termsModal && <FeatureTermsModal {...termsModal} />}
      </div>
    </TerminalShell>
  );
}

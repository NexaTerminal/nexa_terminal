import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import TrialDisabledNotice from '../../components/terminal/TrialDisabledNotice';
import { isTrial, canRequestQATopic, visibleTier, openSubscriptionGate } from '../../lib/tier';
import { TOPIC_CATEGORIES, topicInCategory } from '../../config/topicCategories';
import styles from './Topics.module.css';

// How many published answers we suggest for a solid expert presence.
const PRESENCE_TARGET = 15;

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
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tab = params.get('tab') || 'open';
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const trial = isTrial(currentUser);
  const vt = visibleTier(currentUser);
  const visible = vt === 'B' || vt === 'ADMIN';

  const [worklist, setWorklist] = useState([]);
  const [mine, setMine] = useState([]);
  const [published, setPublished] = useState([]);
  const [publishedCount, setPublishedCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [category, setCategory] = useState('all');

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

  // Published count powers the presence meter — fetched once, independent of tab.
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    axios.get('/api/topics/published-mine', auth)
      .then(res => { if (!cancelled) setPublishedCount((res.data?.items || []).length); })
      .catch(() => { if (!cancelled) setPublishedCount(0); });
    return () => { cancelled = true; };
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Click "Одговори" → claim the topic and go straight to the answer page. No
  // reason, no upfront terms gate — the editorial terms are confirmed at submit.
  const onAnswer = async (topic) => {
    const check = canRequestQATopic(currentUser);
    if (!check.allowed) {
      openSubscriptionGate({ source: 'topics-qa', reason: check.reason });
      return;
    }
    try {
      const res = await axios.post(`/api/topics/worklist/${topic._id}/request`, {}, auth);
      navigate(`/terminal/topics-qa/answer/${res.data?.submission?._id}`);
    } catch (e) {
      const code = e.response?.data?.code;
      setToast({
        type: 'error',
        text: code === 'ALREADY_ACTIVE'
          ? 'Имате веќе една активна тема. Завршете ја или ослободете ја пред да започнете нова.'
          : code === 'NOT_OPEN'
            ? 'Оваа тема штотуку беше земена од друг член.'
            : (e.response?.data?.message || e.message)
      });
    }
  };

  if (!visible && !trial) {
    return (
      <TerminalShell>
        <div className={styles.page}>
          <div className={styles.emptyState}>
            Topics Q&A е достапно само за Про членови.
          </div>
        </div>
      </TerminalShell>
    );
  }

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Topics Q&A · видливост за експерти</span>
          <h1 className={styles.title}>Одговарајте на прашања. Ве наоѓаат клиенти.</h1>
          <p className={styles.lead}>
            Изберете прашање, напишете одговор со Вашето знаење и поднесете го. Штом
            уредникот ќе го одобри, се објавува <strong>под Ваше име</strong> на
            topics.nexa.mk — Google го индексира, а клиентите Ве наоѓаат Вас.
          </p>

          {/* Why answer 10–15 — the brand-awareness case, in one glance. */}
          <div className={styles.whyBand}>
            <div className={styles.whyItem}>
              <span className={styles.whyIcon} aria-hidden><IconTarget /></span>
              <div>
                <div className={styles.whyTitle}>SEO видливост</div>
                <div className={styles.whyDesc}>Секое прашање таргетира она што клиентите веќе го пребаруваат на Google.</div>
              </div>
            </div>
            <div className={styles.whyItem}>
              <span className={styles.whyIcon} aria-hidden><IconWrite /></span>
              <div>
                <div className={styles.whyTitle}>Под Ваше име</div>
                <div className={styles.whyDesc}>Секој одговор носи Ваш потпис и авторство — градите личен бренд.</div>
              </div>
            </div>
            <div className={styles.whyItem}>
              <span className={styles.whyIcon} aria-hidden><IconPublish /></span>
              <div>
                <div className={styles.whyTitle}>Присуство</div>
                <div className={styles.whyDesc}>Одговорете 10–15 прашања за да се етаблирате како оди во областа.</div>
              </div>
            </div>
          </div>

          {/* Presence meter — motivating progress toward ~15 published answers. */}
          {publishedCount != null && (
            <div className={styles.meter}>
              <div className={styles.meterHead}>
                <span>Ваше присуство</span>
                <span className={styles.meterCount}>{publishedCount} / {PRESENCE_TARGET} објавени</span>
              </div>
              <div className={styles.meterTrack}>
                <div
                  className={styles.meterFill}
                  style={{ width: `${Math.min(100, Math.round((publishedCount / PRESENCE_TARGET) * 100))}%` }}
                />
              </div>
              <div className={styles.meterHint}>
                {publishedCount >= PRESENCE_TARGET
                  ? 'Одлично — имате силно присуство. Продолжете да одговарате за да го задржите.'
                  : `Уште ${PRESENCE_TARGET - publishedCount} за препорачаното присуство.`}
              </div>
            </div>
          )}
        </header>

        <nav className={styles.tabs}>
          <Link to="/terminal/topics-qa"                 className={`${styles.tab} ${tab === 'open'      ? styles.tabActive : ''}`}>Прашања</Link>
          <Link to="/terminal/topics-qa?tab=mine"        className={`${styles.tab} ${tab === 'mine'      ? styles.tabActive : ''}`}>Мои одговори</Link>
          <Link to="/terminal/topics-qa?tab=published"   className={`${styles.tab} ${tab === 'published' ? styles.tabActive : ''}`}>Објавени</Link>
        </nav>

        {trial && <TrialDisabledNotice />}
        {toast && <div className={toast.type === 'ok' ? styles.toastOk : styles.toastError}>{toast.text}</div>}

        {loading ? (
          <div className={styles.spinner}>Се вчитува…</div>
        ) : tab === 'open' ? (
          (() => {
            const shown = worklist.filter(t => topicInCategory(t, category));
            return (
              <>
                <div className={styles.catBar}>
                  <button type="button"
                          className={`${styles.catChip} ${category === 'all' ? styles.catChipActive : ''}`}
                          onClick={() => setCategory('all')}>
                    Сите
                  </button>
                  {TOPIC_CATEGORIES.map(c => (
                    <button key={c} type="button"
                            className={`${styles.catChip} ${category === c ? styles.catChipActive : ''}`}
                            onClick={() => setCategory(c)}>
                      {c}
                    </button>
                  ))}
                </div>

                {shown.length === 0 ? (
                  <div className={styles.emptyState}>
                    {category === 'all'
                      ? 'Во моментов нема отворени прашања.'
                      : `Нема отворени прашања во „${category}“.`}
                  </div>
                ) : (
                  <div className={styles.grid}>
                    {shown.map(t => {
                      const taken = t.status !== 'open' || !!t.activeSubmissionId;
                      return (
                        <div key={t._id} className={`${styles.qCard} ${taken ? styles.qCardTaken : ''}`}>
                          <div className={styles.qCardTop}>
                            {t.category && <span className={styles.chip}>{t.category}</span>}
                            {taken && <span className={styles.takenBadge}>Земено</span>}
                          </div>
                          <div className={styles.qCardTitle}>{t.title}</div>
                          {t.scope && <div className={styles.qCardScope}>{t.scope}</div>}
                          <div className={styles.qCardFoot}>
                            <span className={styles.metaItem}><MetaList /> {(t.questions || []).length} прашања</span>
                            {taken ? (
                              <span className={styles.takenNote}>Друг член одговара</span>
                            ) : (
                              <button type="button" className={styles.qCardBtn}
                                      onClick={() => onAnswer(t)}>
                                Одговори →
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()
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
      </div>
    </TerminalShell>
  );
}

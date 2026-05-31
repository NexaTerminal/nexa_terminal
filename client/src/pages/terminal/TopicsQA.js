import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import TrialDisabledNotice from '../../components/terminal/TrialDisabledNotice';
import RequestTopicModal from '../../components/terminal/RequestTopicModal';
import { isTrial, canRequestQATopic, visibleTier } from '../../lib/tier';
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

export default function TopicsQAPage() {
  const { token, currentUser } = useAuth();
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
    if (trial) return;
    if (!canRequestQATopic(currentUser).allowed) return;
    setModalFor(topic);
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
            Topics Q&A е достапно само за Nexa Мрежа · Студио членови.
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
            Експертски Q&A прилози објавени на topics.nexa.mk под Ваше име.
            Темите се однапред структурирани и SEO-таргетирани од уредничкиот тим.
          </p>
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
                    <span>🎯 {t.targetKeyword || '—'}</span>
                    <span>📏 ~{t.targetLengthWords} зборови</span>
                    <span>⏳ Мек рок: {t.softDeadlineDays} дена</span>
                    <span>📝 {(t.questions || []).length} прашања</span>
                  </div>
                  <div className={styles.cardRow}>
                    <span style={{ flex: 1 }} />
                    <button type="button" className={styles.btnPrimary}
                            disabled={trial || !canRequestQATopic(currentUser).allowed}
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
      </div>
    </TerminalShell>
  );
}

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/terminal/Sidebar';
import { refreshInbox } from '../../../lib/inbox';
import { useAuth } from '../../../contexts/AuthContext';
import { viewerRoleFor, counterpartName } from '../../../components/chatbot/ProChatWindow';
import ProRequestThread from '../../../components/proRequests/ProRequestThread';
import AiTranscript from '../../../components/proRequests/AiTranscript';
import ProRequestsApiService from '../../../services/proRequestsApi';
import FeatureTermsModal from '../../../components/terminal/FeatureTermsModal';
import useTermsGate from '../../../hooks/useTermsGate';
import { CURRENT_VERSIONS } from '../../../data/featureTerms';
import styles from './RequestsPage.module.css';

const STATUS_LABEL = {
  pending_approval: 'Се чека одобрување',
  open: 'Се бара професионалец',
  active: 'Во разговор',
  closed: 'Завршено',
  rejected: 'Отстрането',
};
const STATUS_CLASS = {
  pending_approval: 'badgePending',
  open: 'badgePending',
  active: 'badgeActive',
  closed: 'badgeClosed',
  rejected: 'badgeRejected',
};
const TYPE_LABEL = { consult: 'Прашање', contract_review: 'Преглед на договор' };
const CATEGORY_LABEL = { legal: 'Правно', marketing: 'Маркетинг', hr: 'Човечки ресурси', insurance: 'Осигурување', accounting: 'Сметководство' };

const TITLES = {
  mine: { h1: 'Разговори со професионалци', sub: 'Поканувате професионалец од вашите AI разговори — првиот што ќе се приклучи ви одговара тука.' },
  pro: { h1: 'Разговори', sub: 'Сите разговори на едно место: отворени покани што можете да ги преземете и разговорите во кои сте се приклучиле.' },
  assigned: { h1: 'Мои разговори', sub: 'Разговори во кои сте се приклучиле како професионалец.' },
  board: { h1: 'Покани за разговор', sub: 'Корисници бараат професионалец. Првиот што ќе се приклучи го презема разговорот.' },
  admin: { h1: 'Сите барања', sub: 'Сите барања се објавуваат автоматски до професионалците. Отстранете барање ако е потребно.' },
};

// Plain-language status line for a conversation row.
function statusLine(i, view) {
  if (i.status === 'open') {
    return view === 'pro' || view === 'board'
      ? '⏳ Отворена покана — приклучете се'
      : '⏳ Се бара професионалец да се приклучи…';
  }
  if (i.status === 'active') {
    if (view === 'mine') return i.assignedProName ? `💬 ${i.assignedProName}` : '💬 Во разговор';
    if (view === 'pro' && i.awaitingPro) return '🔴 Чека ваш одговор';
    return `💬 ${i.companyName || i.userName || 'Во разговор'}`;
  }
  if (i.status === 'closed') return '✓ Завршено';
  if (i.status === 'rejected') return 'Отстрането';
  return STATUS_LABEL[i.status] || '';
}

function timeAgo(d) {
  if (!d) return '';
  const t = new Date(d).getTime();
  if (isNaN(t)) return '';
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return 'сега';
  const m = Math.floor(s / 60); if (m < 60) return `пред ${m} мин`;
  const h = Math.floor(m / 60); if (h < 24) return `пред ${h} ч`;
  const dd = Math.floor(h / 24); if (dd < 7) return `пред ${dd} д`;
  try { return new Date(d).toLocaleDateString('mk-MK', { day: '2-digit', month: '2-digit' }); } catch { return ''; }
}

/**
 * RequestsPage — one role-aware master/detail view over `pro_requests`.
 * `view` = 'mine' (requester) | 'pro' (Pro: open board + my conversations in one) |
 * 'assigned' | 'board' | 'admin'. The viewer's thread role maps mine→user,
 * pro/assigned→pro, admin→admin.
 */
export default function RequestsPage({ view = 'mine' }) {
  const { currentUser } = useAuth();
  const { requireTerms, termsModal } = useTermsGate();
  const role = view === 'admin' ? 'admin' : (view === 'assigned' || view === 'pro' || view === 'board') ? 'pro' : 'user';
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(false);
  const [notice, setNotice] = useState(null);

  // Open items are preloaded board snapshots (a Pro can't GET /:id before joining).
  const isOpenItem = (i) => i && i.status === 'open';
  const proSide = view === 'pro' || view === 'board';

  // `quiet` = background refresh (no spinner, no error banner churn).
  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) { setLoading(true); setError(null); }
    try {
      if (view === 'pro') {
        const [b, m] = await Promise.all([ProRequestsApiService.board(), ProRequestsApiService.list('assigned')]);
        const open = (b && b.success && b.items) ? b.items : [];
        const mine = (m && m.success && m.items) ? m.items : [];
        setItems([...open, ...mine]); // open invitations first, then my conversations
      } else if (view === 'board') {
        const res = await ProRequestsApiService.board();
        if (res.success) setItems(res.items || []); else setError(res.message || 'Грешка при вчитување.');
      } else {
        const res = await ProRequestsApiService.list(view);
        if (res.success) setItems(res.items || []); else setError(res.message || 'Грешка при вчитување.');
      }
    } catch (e) { if (!quiet) setError(e.message || 'Грешка при вчитување.'); }
    finally { if (!quiet) setLoading(false); }
  }, [view]);

  useEffect(() => { load(); }, [load]);

  // Keep the list fresh in the background (new invitations, "awaiting reply"
  // markers on conversations that aren't open) — every minute + on focus.
  useEffect(() => {
    const refresh = () => load({ quiet: true });
    const iv = setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    return () => { clearInterval(iv); window.removeEventListener('focus', refresh); };
  }, [load]);

  // Live thread: while an active conversation is open, re-fetch it every ~15s
  // (+ on window focus) so each side sees the other's new messages without
  // having to reopen the request.
  const selectedId = selected?._id;
  const selectedActive = selected?.status === 'active';
  useEffect(() => {
    if (!selectedId || !selectedActive) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const res = await ProRequestsApiService.get(selectedId);
        if (!cancelled && res?.success && res.item) onUpdated(res.item);
      } catch (_) { /* transient — next tick retries */ }
    };
    const iv = setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    return () => { cancelled = true; clearInterval(iv); window.removeEventListener('focus', refresh); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selectedActive]);

  async function openRequest(item) {
    setRejectReason(''); setNotice(null);
    if (proSide && isOpenItem(item)) { setSelected(item); return; } // preloaded board snapshot
    try {
      const res = await ProRequestsApiService.get(item._id);
      if (res.success) { setSelected(res.item); refreshInbox(); } // opening marks pro replies as seen
    } catch (e) { setError(e.message); }
  }

  // Deep link from the messaging bar's „full page" button: ?id=<request id>.
  const [searchParams] = useSearchParams();
  const deepLinkId = searchParams.get('id');
  const deepLinked = useRef(false);
  useEffect(() => {
    if (!deepLinkId || deepLinked.current || loading) return;
    deepLinked.current = true;
    openRequest(items.find((i) => i._id === deepLinkId) || { _id: deepLinkId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkId, loading, items]);

  // First join shows the confidentiality terms once (recorded per user); later joins go straight in.
  function claim() {
    if (acting || !selected) return;
    requireTerms('proJoin', doClaim);
  }

  async function doClaim() {
    if (!selected) return;
    setActing(true); setError(null);
    try {
      const res = await ProRequestsApiService.claim(selected._id, { acceptLiability: true, consentVersion: CURRENT_VERSIONS.proJoin });
      if (res.success) {
        setNotice('Се приклучивте во разговорот.');
        if (view === 'pro') { setSelected(res.item); load(); }
        else { setItems((prev) => prev.filter((i) => i._id !== selected._id)); setSelected(null); }
      } else setError(res.message);
    } catch (e) { setError(e.message); }
    finally { setActing(false); }
  }

  function onUpdated(updated) {
    setSelected(updated);
    setItems((prev) => prev.map((i) => (i._id === updated._id ? { ...i, ...updated } : i)));
    refreshInbox(); // messaging-bar badge
  }

  const awaitingCount = view === 'pro' ? items.filter((i) => i.awaitingPro).length : 0;

  async function reject() {
    if (acting) return;
    setActing(true); setError(null);
    try {
      const res = await ProRequestsApiService.reject(selected._id, rejectReason.trim());
      if (res.success) onUpdated(res.item);
      else setError(res.message);
    } catch (e) { setError(e.message); }
    finally { setActing(false); }
  }

  const t = TITLES[view] || TITLES.mine;
  const showJoin = selected && isOpenItem(selected) && proSide;

  return (
    <div>
      <Header isTerminal={true} />
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.container}>
          <header className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>{t.h1}</h1>
            <p className={styles.pageSubtitle}>{t.sub}</p>
          </header>

          {error && <div className={styles.errorBanner}>⚠️ {error}</div>}
          {notice && <div className={styles.noticeBanner}>✓ {notice}</div>}
          {awaitingCount > 0 && (
            <div className={styles.awaitingBanner}>
              🔴 {awaitingCount === 1 ? '1 разговор чека' : `${awaitingCount} разговори чекаат`} ваш одговор.
            </div>
          )}

          <div className={styles.layout}>
            {/* List */}
            <aside className={styles.list}>
              {loading ? (
                <p className={styles.muted}>Вчитување…</p>
              ) : items.length === 0 ? (
                <p className={styles.muted}>
                  {view === 'mine' ? 'Сè уште немате разговори. Поканете професионалец од некој AI разговор.'
                    : proSide ? 'Нема отворени покани во моментов.'
                    : 'Нема разговори.'}
                </p>
              ) : (
                items.map((i) => {
                  // LinkedIn-style inbox row: who it's with, the topic, then status.
                  const invite = isOpenItem(i) && proSide;
                  const who = view === 'admin'
                    ? (i.companyName || i.userName || i.userEmail || '—')
                    : invite ? 'Отворена покана' : counterpartName(i, viewerRoleFor(i, currentUser));
                  const unread = view === 'mine' ? i.unreadForUser > 0 : !!i.awaitingPro;
                  return (
                    <button
                      key={i._id}
                      className={`${styles.listItem} ${selected?._id === i._id ? styles.listItemActive : ''} ${invite ? styles.listItemOpen : ''} ${unread ? styles.listItemUnread : ''}`}
                      onClick={() => openRequest(i)}
                    >
                      <span className={styles.rowAvatar} aria-hidden>{invite ? '📨' : who.trim().charAt(0).toUpperCase()}</span>
                      <span className={styles.rowBody}>
                        <span className={styles.rowTop}>
                          <span className={styles.rowName}>{who}</span>
                          <span className={styles.rowTime}>{timeAgo(i.updatedAt || i.createdAt)}</span>
                        </span>
                        <span className={styles.rowSubject}>{i.subject}</span>
                        {view !== 'admin' && <span className={styles.rowStatus}>{statusLine(i, view)}</span>}
                      </span>
                      {unread && <span className={styles.unreadDot} aria-label="Ново" />}
                    </button>
                  );
                })
              )}
            </aside>

            {/* Detail */}
            <section className={styles.detail}>
              {!selected ? (
                <p className={styles.muted}>Изберете разговор од листата.</p>
              ) : showJoin ? (
                /* ── Open invitation: Pro joins the conversation ── */
                <>
                  <div className={styles.detailHead}>
                    <div>
                      <h2 className={styles.detailTitle}>{selected.subject}</h2>
                      <span className={styles.detailType}>{CATEGORY_LABEL[selected.category] || selected.category}</span>
                    </div>
                    <span className={`${styles.badge} ${styles.badgePending}`}>Се бара професионалец</span>
                  </div>

                  <AiTranscript text={selected.transcript} summary={selected.aiSummary} question={selected.question} />
                  {selected.documentName && <p className={styles.muted}>Документ: {selected.documentName}</p>}

                  {/* Join = enter the chat (chat-balloon CTA). Implied consent. */}
                  <div className={styles.joinCard}>
                    <div className={styles.joinBubble} aria-hidden>💬</div>
                    <button className={styles.joinBtn} onClick={claim} disabled={acting}>
                      {acting ? 'Се приклучувам…' : 'Приклучи се во разговорот'}
                    </button>
                    <p className={styles.joinHint}>Првиот што ќе се приклучи го презема разговорот — потоа е заклучен за другите.</p>
                    <p className={styles.joinDisclaimer}>
                      Со приклучување се согласувате со <a href="/terms-conditions" target="_blank" rel="noopener noreferrer">општите услови</a>.
                      Соработката и надоместокот се договараат директно меѓу вас и клиентот. AI одговорите се информативни; советот е ваша професионална одговорност.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.detailHead}>
                    <div>
                      <h2 className={styles.detailTitle}>{selected.subject}</h2>
                      <span className={styles.detailType}>{TYPE_LABEL[selected.type] || selected.type}</span>
                    </div>
                    <span className={`${styles.badge} ${styles[STATUS_CLASS[selected.status]]}`}>{STATUS_LABEL[selected.status]}</span>
                  </div>

                  {selected.context?.documentRef && (
                    <div className={styles.contextBox}>
                      <span className={styles.contextLabel}>Документ</span>
                      <a href={selected.context.documentRef} target="_blank" rel="noopener noreferrer" className={styles.docLink}>
                        {selected.context.documentName || 'Отвори документ'}
                      </a>
                    </div>
                  )}

                  {/* Admin oversight: requests auto-publish to all Pros — only action is remove. */}
                  {view === 'admin' && (selected.status === 'pending_approval' || selected.status === 'open') && (
                    <div className={styles.adminBox}>
                      <div className={styles.adminRow}>
                        <input
                          className={styles.rejectInput}
                          placeholder="Причина за отстранување (опционално)"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <button className={styles.dangerBtn} onClick={reject} disabled={acting}>Отстрани</button>
                      </div>
                    </div>
                  )}

                  {/* Open (user's own) — calm waiting state, like a sent invite */}
                  {selected.status === 'open' && view === 'mine' && (
                    <div className={styles.waitingBox}>
                      <span className={styles.waitingDot} aria-hidden />
                      <div>
                        <strong>Го зачувавме барањето.</strong>
                        <p className={styles.muted}>Проверуваме дали има достапен професионалец. Ако некој се приклучи, ќе ви одговори тука и ќе добиете известување — тоа засега не е загарантирано.</p>
                      </div>
                    </div>
                  )}
                  {selected.status === 'open' && view === 'mine' && (
                    <AiTranscript text={selected.context?.transcriptExcerpt} summary={selected.context?.aiSummary} question={selected.context?.question} />
                  )}

                  {/* Thread (active/closed) — AI history + human↔human chat + disclaimer */}
                  {(selected.status === 'active' || selected.status === 'closed') && (
                    <ProRequestThread request={selected} role={role} onUpdated={onUpdated} />
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>
      {termsModal && <FeatureTermsModal {...termsModal} />}
    </div>
  );
}

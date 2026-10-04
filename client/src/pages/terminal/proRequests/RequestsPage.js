import React, { useCallback, useEffect, useState } from 'react';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/terminal/Sidebar';
import ProRequestThread from '../../../components/proRequests/ProRequestThread';
import ProRequestsApiService from '../../../services/proRequestsApi';
import styles from './RequestsPage.module.css';

const STATUS_LABEL = {
  pending_approval: 'Се чека одобрување',
  open: 'Споделено со професионалци',
  active: 'Активно',
  closed: 'Затворено',
  rejected: 'Одбиено',
};
const STATUS_CLASS = {
  pending_approval: 'badgePending',
  open: 'badgePending',
  active: 'badgeActive',
  closed: 'badgeClosed',
  rejected: 'badgeRejected',
};
const TYPE_LABEL = { consult: 'Прашање', contract_review: 'Преглед на договор' };
const CATEGORY_LABEL = { legal: 'Правно', marketing: 'Маркетинг', hr: 'Човечки ресурси', insurance: 'Осигурување' };
const LIABILITY_NOTE =
  'AI одговорите се информативни и не се правен совет. Советот од професионалецот е негова професионална одговорност.';

const TITLES = {
  mine: { h1: 'Моите барања', sub: 'Вашите прашања и барања за преглед од професионалец.' },
  assigned: { h1: 'Преземени барања', sub: 'Барања што ги презедовте и разговори со клиенти на Nexa.' },
  board: { h1: 'Отворени барања', sub: 'Барања од корисници што чекаат професионалец. Првиот што ќе се приклучи го презема разговорот.' },
  admin: { h1: 'Барања (админ)', sub: 'Одобрете ги барањата и објавете ги на таблата за професионалци.' },
};

/**
 * RequestsPage — one role-aware master/detail view over `pro_requests`.
 * `view` = 'mine' (requester) | 'assigned' (Pro) | 'admin'. The viewer's thread
 * role maps 1:1 (mine→user, assigned→pro, admin→admin).
 */
export default function RequestsPage({ view = 'mine' }) {
  const role = view === 'admin' ? 'admin' : view === 'assigned' ? 'pro' : 'user';
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Admin reject state
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(false);
  // Board claim state
  const [acceptLiability, setAcceptLiability] = useState(false);
  const [notice, setNotice] = useState(null);

  const isBoard = view === 'board';

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = isBoard ? await ProRequestsApiService.board() : await ProRequestsApiService.list(view);
      if (res.success) setItems(res.items || []);
      else setError(res.message || 'Грешка при вчитување.');
    } catch (e) { setError(e.message || 'Грешка при вчитување.'); }
    finally { setLoading(false); }
  }, [view, isBoard]);

  useEffect(() => { load(); }, [load]);

  async function openRequest(idOrItem) {
    setRejectReason(''); setAcceptLiability(false); setNotice(null);
    // Board items are pre-loaded (a Pro has no access to GET /:id before claiming).
    if (isBoard) { setSelected(typeof idOrItem === 'object' ? idOrItem : items.find((i) => i._id === idOrItem)); return; }
    try {
      const res = await ProRequestsApiService.get(idOrItem);
      if (res.success) setSelected(res.item);
    } catch (e) { setError(e.message); }
  }

  async function approveToBoard() {
    if (acting) return;
    setActing(true); setError(null); setNotice(null);
    try {
      const res = await ProRequestsApiService.approveToBoard(selected._id);
      if (res.success) { onUpdated(res.item); setNotice(`Објавено на таблата. Известени се ${res.notified ?? 0} професионалци.`); }
      else setError(res.message);
    } catch (e) { setError(e.message); }
    finally { setActing(false); }
  }

  async function claim() {
    if (acting) return;
    if (!acceptLiability) { setError('Потврдете ја професионалната одговорност за да се приклучите.'); return; }
    setActing(true); setError(null);
    try {
      const res = await ProRequestsApiService.claim(selected._id, { acceptLiability: true, consentVersion: 1 });
      if (res.success) {
        // Claimed → leaves the board; it now lives under „Преземени барања".
        setItems((prev) => prev.filter((i) => i._id !== selected._id));
        setSelected(null);
        setNotice('Го презедовте барањето. Продолжете го разговорот во „Преземени барања".');
      } else setError(res.message);
    } catch (e) { setError(e.message); }
    finally { setActing(false); }
  }

  function onUpdated(updated) {
    setSelected(updated);
    setItems((prev) => prev.map((i) => (i._id === updated._id ? { ...i, ...updated } : i)));
  }

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

          <div className={styles.layout}>
            {/* List */}
            <aside className={styles.list}>
              {loading ? (
                <p className={styles.muted}>Вчитување…</p>
              ) : items.length === 0 ? (
                <p className={styles.muted}>Нема барања.</p>
              ) : (
                items.map((i) => (
                  <button
                    key={i._id}
                    className={`${styles.listItem} ${selected?._id === i._id ? styles.listItemActive : ''}`}
                    onClick={() => openRequest(i._id)}
                  >
                    <div className={styles.listTop}>
                      <span className={styles.listType}>
                        {isBoard ? (CATEGORY_LABEL[i.category] || i.category || 'Барање') : (TYPE_LABEL[i.type] || i.type)}
                      </span>
                      <span className={`${styles.badge} ${styles[STATUS_CLASS[i.status]]}`}>{STATUS_LABEL[i.status]}</span>
                    </div>
                    <div className={styles.listSubject}>{i.subject}</div>
                    <div className={styles.listMeta}>
                      {view === 'mine'
                        ? (i.assignedProName ? `Професионалец: ${i.assignedProName}` : '—')
                        : (i.companyName || i.userName || i.userEmail || '—')}
                    </div>
                  </button>
                ))
              )}
            </aside>

            {/* Detail */}
            <section className={styles.detail}>
              {!selected ? (
                <p className={styles.muted}>Изберете барање од листата.</p>
              ) : isBoard ? (
                /* ── Board: Pro decides whether to claim an open request ── */
                <>
                  <div className={styles.detailHead}>
                    <div>
                      <h2 className={styles.detailTitle}>{selected.subject}</h2>
                      <span className={styles.detailType}>{CATEGORY_LABEL[selected.category] || selected.category}</span>
                    </div>
                    <span className={`${styles.badge} ${styles.badgePending}`}>Отворено</span>
                  </div>

                  {selected.aiSummary && (
                    <div className={styles.contextBox}>
                      <span className={styles.contextLabel}>Резиме на разговорот со AI</span>
                      <p className={styles.contextText}>{selected.aiSummary}</p>
                    </div>
                  )}
                  {selected.question && (
                    <div className={styles.contextBox}>
                      <span className={styles.contextLabel}>Прашање од корисникот</span>
                      <p className={styles.contextText}>{selected.question}</p>
                    </div>
                  )}
                  {selected.documentName && (
                    <p className={styles.muted}>Документ: {selected.documentName}</p>
                  )}

                  <div className={styles.liabilityBox}>
                    <label className={styles.liabilityLabel}>
                      <input type="checkbox" checked={acceptLiability} onChange={(e) => setAcceptLiability(e.target.checked)} />
                      <span>Потврдувам дека ако се приклучам и дадам совет, јас сум професионално одговорен за неговата точност. {LIABILITY_NOTE}</span>
                    </label>
                    <button className={styles.primaryBtn} onClick={claim} disabled={acting || !acceptLiability}>
                      Преземи и приклучи се
                    </button>
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

                  {/* Context */}
                  {selected.context?.aiSummary && (
                    <div className={styles.contextBox}>
                      <span className={styles.contextLabel}>Резиме на разговорот со AI</span>
                      <p className={styles.contextText}>{selected.context.aiSummary}</p>
                    </div>
                  )}
                  {selected.context?.question && (
                    <div className={styles.contextBox}>
                      <span className={styles.contextLabel}>Прашање</span>
                      <p className={styles.contextText}>{selected.context.question}</p>
                    </div>
                  )}
                  {selected.context?.documentRef && (
                    <div className={styles.contextBox}>
                      <span className={styles.contextLabel}>Документ</span>
                      <a href={selected.context.documentRef} target="_blank" rel="noopener noreferrer" className={styles.docLink}>
                        {selected.context.documentName || 'Отвори документ'}
                      </a>
                    </div>
                  )}

                  {/* Admin controls for pending requests */}
                  {view === 'admin' && selected.status === 'pending_approval' && (
                    <div className={styles.adminBox}>
                      <div className={styles.adminRow}>
                        <button className={styles.primaryBtn} onClick={approveToBoard} disabled={acting}>
                          Одобри и објави на таблата
                        </button>
                        <span className={styles.muted}>Барањето се испраќа до сите соодветни професионалци; првиот што ќе се приклучи го презема.</span>
                      </div>
                      <div className={styles.adminRow}>
                        <input
                          className={styles.rejectInput}
                          placeholder="Причина за одбивање (опционално)"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <button className={styles.dangerBtn} onClick={reject} disabled={acting}>Одбиј</button>
                      </div>
                    </div>
                  )}

                  {/* Open (awaiting a Pro to claim) */}
                  {selected.status === 'open' && view !== 'admin' && (
                    <p className={styles.muted}>Споделено со професионалци — чека некој да се приклучи во разговорот.</p>
                  )}

                  {/* Assigned pro info (for user/admin) */}
                  {selected.assignedProName && view !== 'assigned' && (
                    <p className={styles.muted}>Во разговорот: <strong>{selected.assignedProName}</strong></p>
                  )}

                  {/* Liability banner once a thread exists */}
                  {(selected.status === 'active' || selected.status === 'closed') && (
                    <p className={styles.liabilityNote}>ℹ️ {LIABILITY_NOTE}</p>
                  )}

                  {/* Thread (active/closed only — open has no thread yet) */}
                  {(selected.status === 'active' || selected.status === 'closed') && (
                    <ProRequestThread request={selected} role={role} onUpdated={onUpdated} />
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

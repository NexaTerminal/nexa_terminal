import React, { useCallback, useEffect, useState } from 'react';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/terminal/Sidebar';
import ProRequestThread from '../../../components/proRequests/ProRequestThread';
import ProRequestsApiService from '../../../services/proRequestsApi';
import styles from './RequestsPage.module.css';

const STATUS_LABEL = {
  pending_approval: 'Се чека одобрување',
  active: 'Активно',
  closed: 'Затворено',
  rejected: 'Одбиено',
};
const STATUS_CLASS = {
  pending_approval: 'badgePending',
  active: 'badgeActive',
  closed: 'badgeClosed',
  rejected: 'badgeRejected',
};
const TYPE_LABEL = { consult: 'Прашање', contract_review: 'Преглед на договор' };

const TITLES = {
  mine: { h1: 'Моите барања', sub: 'Вашите прашања и барања за преглед од професионалец.' },
  assigned: { h1: 'Барања', sub: 'Барања доделени на вас од клиенти на Nexa.' },
  admin: { h1: 'Барања (админ)', sub: 'Одобрете и доделете барања на професионалец.' },
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

  // Admin assign state
  const [providers, setProviders] = useState([]);
  const [chosenPro, setChosenPro] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await ProRequestsApiService.list(view);
      if (res.success) setItems(res.items || []);
      else setError(res.message || 'Грешка при вчитување.');
    } catch (e) { setError(e.message || 'Грешка при вчитување.'); }
    finally { setLoading(false); }
  }, [view]);

  useEffect(() => { load(); }, [load]);

  // Load providers once for admin (for hand-pick).
  useEffect(() => {
    if (view !== 'admin') return;
    ProRequestsApiService.providers()
      .then((r) => { if (r.success) setProviders(r.items || []); })
      .catch(() => {});
  }, [view]);

  async function openRequest(id) {
    setChosenPro(''); setRejectReason('');
    try {
      const res = await ProRequestsApiService.get(id);
      if (res.success) setSelected(res.item);
    } catch (e) { setError(e.message); }
  }

  function onUpdated(updated) {
    setSelected(updated);
    setItems((prev) => prev.map((i) => (i._id === updated._id ? { ...i, ...updated } : i)));
  }

  async function approve() {
    if (!chosenPro || acting) { setError('Изберете професионалец.'); return; }
    setActing(true); setError(null);
    try {
      const res = await ProRequestsApiService.approve(selected._id, chosenPro);
      if (res.success) { onUpdated(res.item); }
      else setError(res.message);
    } catch (e) { setError(e.message); }
    finally { setActing(false); }
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
                      <span className={styles.listType}>{TYPE_LABEL[i.type] || i.type}</span>
                      <span className={`${styles.badge} ${styles[STATUS_CLASS[i.status]]}`}>{STATUS_LABEL[i.status]}</span>
                    </div>
                    <div className={styles.listSubject}>{i.subject}</div>
                    <div className={styles.listMeta}>
                      {view === 'mine'
                        ? (i.assignedProName ? `Професионалец: ${i.assignedProName}` : '—')
                        : (i.userName || i.companyName || i.userEmail || '—')}
                    </div>
                  </button>
                ))
              )}
            </aside>

            {/* Detail */}
            <section className={styles.detail}>
              {!selected ? (
                <p className={styles.muted}>Изберете барање од листата.</p>
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

                  {/* Admin approval controls for pending requests */}
                  {view === 'admin' && selected.status === 'pending_approval' && (
                    <div className={styles.adminBox}>
                      <div className={styles.adminRow}>
                        <select value={chosenPro} onChange={(e) => setChosenPro(e.target.value)} className={styles.select}>
                          <option value="">Избери професионалец…</option>
                          {providers.map((p) => (
                            <option key={p._id} value={p._id}>{p.name}{p.companyName ? ` — ${p.companyName}` : ''}</option>
                          ))}
                        </select>
                        <button className={styles.primaryBtn} onClick={approve} disabled={acting}>Одобри и додели</button>
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

                  {/* Assigned pro info (for user/admin) */}
                  {selected.assignedProName && view !== 'assigned' && (
                    <p className={styles.muted}>Доделено на: <strong>{selected.assignedProName}</strong></p>
                  )}

                  {/* Thread (active/closed/rejected show appropriate state) */}
                  {selected.status !== 'pending_approval' && (
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

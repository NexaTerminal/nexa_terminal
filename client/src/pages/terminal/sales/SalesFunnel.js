import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import { fmtDate } from '../contracts/Contracts';
import styles from './SalesFunnel.module.css';

/**
 * Продажна инка — visual sales funnel (tasks/todo.md 2026-07-14).
 * The funnel IS the navigation: each layer is a clickable filter, the panel
 * beside it works the deals of the selected stage.
 */

const OPEN_STAGES = [
  { key: 'potential',   label: 'Потенцијални',     hint: 'Секој што може да стане клиент' },
  { key: 'contacted',   label: 'Контактирани',     hint: 'Остварен прв контакт' },
  { key: 'offer',       label: 'Испратена понуда', hint: 'Чекаат одговор на понуда' },
  { key: 'negotiation', label: 'Преговори',        hint: 'Сериозни разговори за услови' }
];
const OUTCOMES = [
  { key: 'won',  label: 'Добиени'  },
  { key: 'lost', label: 'Изгубени' }
];
const STAGE_LABEL = Object.fromEntries([...OPEN_STAGES, ...OUTCOMES].map(s => [s.key, s.label]));
// Label on the one-click "advance" button per open stage.
const NEXT_OF = { potential: 'contacted', contacted: 'offer', offer: 'negotiation', negotiation: 'won' };
const NEXT_LABEL = {
  potential: '→ Контактиран',
  contacted: '→ Понуда',
  offer: '→ Преговори',
  negotiation: '✓ Добиена'
};

const fmtEUR = (n) => {
  if (n === null || n === undefined || Number(n) === 0) return null;
  return '€' + Number(n).toLocaleString('de-DE', { maximumFractionDigits: 0 });
};

const dayStart = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

const actionTone = (deal) => {
  if (!deal.nextActionAt) return null;
  const today = dayStart(new Date());
  const due = dayStart(deal.nextActionAt);
  if (due < today) return 'overdue';
  if (due.getTime() === today.getTime()) return 'today';
  return 'upcoming';
};

const EMPTY_FORM = {
  name: '', person: '', email: '', phone: '',
  value: '', stage: 'potential', nextActionAt: '', nextActionNote: '', note: ''
};

export default function SalesFunnel() {
  const { token } = useAuth();
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const [summary, setSummary] = useState(null);
  const [stage, setStage] = useState('potential');
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState('');

  // Create / edit modal
  const [modal, setModal] = useState(null); // null | { id?, form }
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  // Lost-reason inline prompt: deal id currently being marked lost
  const [losing, setLosing] = useState(null); // { id, reason }
  const [confirmDelete, setConfirmDelete] = useState(null); // deal id

  const loadSummary = useCallback(async () => {
    const res = await axios.get('/api/sales/summary', auth);
    setSummary(res.data.data);
  }, [auth]);

  const loadDeals = useCallback(async (st) => {
    setListLoading(true);
    try {
      const res = await axios.get('/api/sales', { ...auth, params: { stage: st } });
      setDeals(res.data.data);
    } finally {
      setListLoading(false);
    }
  }, [auth]);

  const loadAll = useCallback(async (st) => {
    setError('');
    try {
      await Promise.all([loadSummary(), loadDeals(st)]);
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при вчитување на продажната инка.');
    } finally {
      setLoading(false);
    }
  }, [loadSummary, loadDeals]);

  useEffect(() => { loadAll(stage); }, [loadAll, stage]);

  const selectStage = (key) => { if (key !== stage) { setStage(key); } };

  // ---- Mutations ----------------------------------------------------------

  const moveStage = async (deal, toStage, lostReason) => {
    try {
      await axios.patch(`/api/sales/${deal._id}/stage`, { stage: toStage, lostReason }, auth);
      setLosing(null);
      await loadAll(stage);
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при преместување на зделката.');
    }
  };

  const removeDeal = async (id) => {
    try {
      await axios.delete(`/api/sales/${id}`, auth);
      setConfirmDelete(null);
      await loadAll(stage);
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при бришење на зделката.');
    }
  };

  const openCreate = () => {
    setModalError('');
    setModal({ id: null, form: { ...EMPTY_FORM, stage } });
  };

  const openEdit = (deal) => {
    setModalError('');
    setModal({
      id: deal._id,
      form: {
        name: deal.name || '',
        person: deal.contact?.person || '',
        email: deal.contact?.email || '',
        phone: deal.contact?.phone || '',
        value: deal.value ?? '',
        stage: deal.stage,
        nextActionAt: deal.nextActionAt ? String(deal.nextActionAt).slice(0, 10) : '',
        nextActionNote: deal.nextActionNote || '',
        note: deal.note || ''
      }
    });
  };

  const setF = (k, v) => setModal((m) => ({ ...m, form: { ...m.form, [k]: v } }));

  const saveModal = async (e) => {
    e.preventDefault();
    const f = modal.form;
    if (!f.name.trim()) { setModalError('Внесете име на компанија или контакт.'); return; }
    setSaving(true); setModalError('');
    const payload = {
      name: f.name,
      contact: { person: f.person, email: f.email, phone: f.phone },
      value: f.value === '' ? null : Number(f.value),
      note: f.note,
      nextActionAt: f.nextActionAt || null,
      nextActionNote: f.nextActionNote
    };
    try {
      if (modal.id) {
        await axios.patch(`/api/sales/${modal.id}`, payload, auth);
        // Stage changes from the edit form go through the stage endpoint so
        // history/wonAt stay correct.
        const current = deals.find((d) => d._id === modal.id);
        if (current && f.stage !== current.stage) {
          await axios.patch(`/api/sales/${modal.id}/stage`, { stage: f.stage }, auth);
        }
      } else {
        await axios.post('/api/sales', { ...payload, stage: f.stage }, auth);
        setStage(f.stage); // jump to where the new deal landed
      }
      setModal(null);
      await loadAll(modal.id ? stage : f.stage);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Грешка при зачувување.');
    } finally {
      setSaving(false);
    }
  };

  // ---- Derived ------------------------------------------------------------

  const stages = summary?.stages || {};
  const openTotal = OPEN_STAGES.reduce((a, s) => a + (stages[s.key]?.count || 0), 0);
  const openValue = OPEN_STAGES.reduce((a, s) => a + (stages[s.key]?.value || 0), 0);
  const maxCount = Math.max(1, ...OPEN_STAGES.map((s) => stages[s.key]?.count || 0));

  // Conversion % between consecutive layers (of deals that reached layer i,
  // how many reached layer i+1 or beyond — approximated from current counts).
  const reached = (idx) => {
    let sum = stages.won?.count || 0;
    for (let i = idx; i < OPEN_STAGES.length; i++) sum += stages[OPEN_STAGES[i].key]?.count || 0;
    return sum;
  };
  const conversion = (idx) => {
    const from = reached(idx);
    if (!from) return null;
    return Math.round((reached(idx + 1) / from) * 100);
  };

  const isEmpty = openTotal === 0 && !(stages.won?.count || 0) && !(stages.lost?.count || 0);

  if (loading) {
    return (
      <TerminalShell>
        <div className={styles.page}><div className={styles.loading}>Се вчитува…</div></div>
      </TerminalShell>
    );
  }

  return (
    <TerminalShell>
      <div className={styles.page}>
        <div className={styles.headRow}>
          <div>
            <h1 className={styles.title}>Продажна инка</h1>
            <p className={styles.subtitle}>
              Водете ги потенцијалните клиенти од прв контакт до затворена зделка —
              кликнете на слој од инката за да работите со зделките во него.
            </p>
          </div>
          <button className={styles.primaryBtn} onClick={openCreate}>+ Нов контакт</button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {/* KPI row */}
        <div className={styles.kpiRow}>
          <div className={styles.kpi}>
            <span className={styles.kpiValue}>{openTotal}{fmtEUR(openValue) ? ` · ${fmtEUR(openValue)}` : ''}</span>
            <span className={styles.kpiLabel}>Отворени зделки</span>
          </div>
          <div className={`${styles.kpi} ${styles.kpiWon}`}>
            <span className={styles.kpiValue}>
              {summary?.wonThisMonth?.count || 0}
              {fmtEUR(summary?.wonThisMonth?.value) ? ` · ${fmtEUR(summary.wonThisMonth.value)}` : ''}
            </span>
            <span className={styles.kpiLabel}>Добиени овој месец</span>
          </div>
          <div className={`${styles.kpi} ${summary?.overdue ? styles.kpiOverdue : ''}`}>
            <span className={styles.kpiValue}>{summary?.overdue || 0}</span>
            <span className={styles.kpiLabel}>Задоцнети активности</span>
          </div>
        </div>

        {isEmpty ? (
          <div className={styles.emptyState}>
            <h2>Изградете ја Вашата прва продажна инка</h2>
            <ol>
              <li>Додадете ги сите компании и луѓе што би можеле да станат клиенти — тоа се <strong>Потенцијални</strong>.</li>
              <li>Штом остварите контакт или испратите понуда, преместете ги подолу со еден клик.</li>
              <li>Инката ви покажува каде застануваат зделките — и кого да го побарате денес.</li>
            </ol>
            <button className={styles.primaryBtn} onClick={openCreate}>+ Додади прв контакт</button>
          </div>
        ) : (
          <div className={styles.mainGrid}>
            {/* ---- Funnel ---- */}
            <div className={styles.funnelCol}>
              <div className={styles.funnel}>
                {OPEN_STAGES.map((s, i) => {
                  const st = stages[s.key] || { count: 0, value: 0 };
                  // Visual narrowing: 100% → 58%, softened by data so a layer
                  // with more deals never looks thinner than the one above.
                  const width = 100 - i * 14;
                  const conv = conversion(i);
                  return (
                    <div key={s.key} className={styles.layerRow}>
                      <button
                        type="button"
                        onClick={() => selectStage(s.key)}
                        className={`${styles.layer} ${styles['layer' + i]} ${stage === s.key ? styles.layerActive : ''}`}
                        style={{ width: `${width}%` }}
                        title={s.hint}
                      >
                        <span className={styles.layerLabel}>{s.label}</span>
                        <span className={styles.layerStats}>
                          <span className={styles.layerCount}>{st.count}</span>
                          {fmtEUR(st.value) && <span className={styles.layerValue}>{fmtEUR(st.value)}</span>}
                        </span>
                        <span
                          className={styles.layerBar}
                          style={{ width: `${Math.round(((st.count || 0) / maxCount) * 100)}%` }}
                          aria-hidden
                        />
                      </button>
                      {conv !== null && i < OPEN_STAGES.length - 1 && (
                        <span className={styles.convChip} title="Колку од овој слој стигнуваат подолу">↓ {conv}%</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className={styles.outcomes}>
                <button
                  type="button"
                  onClick={() => selectStage('won')}
                  className={`${styles.outcome} ${styles.outcomeWon} ${stage === 'won' ? styles.outcomeActive : ''}`}
                >
                  <span className={styles.outcomeLabel}>✓ Добиени</span>
                  <span className={styles.outcomeStats}>
                    {(stages.won?.count || 0)}{fmtEUR(stages.won?.value) ? ` · ${fmtEUR(stages.won.value)}` : ''}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => selectStage('lost')}
                  className={`${styles.outcome} ${styles.outcomeLost} ${stage === 'lost' ? styles.outcomeActive : ''}`}
                >
                  <span className={styles.outcomeLabel}>✕ Изгубени</span>
                  <span className={styles.outcomeStats}>
                    {(stages.lost?.count || 0)}{fmtEUR(stages.lost?.value) ? ` · ${fmtEUR(stages.lost.value)}` : ''}
                  </span>
                </button>
              </div>
            </div>

            {/* ---- Deals of selected stage ---- */}
            <div className={styles.listCol}>
              <div className={styles.listHead}>
                <h2 className={styles.listTitle}>
                  {STAGE_LABEL[stage]} <span className={styles.listCount}>{deals.length}</span>
                </h2>
              </div>

              {listLoading ? (
                <div className={styles.loading}>Се вчитува…</div>
              ) : deals.length === 0 ? (
                <div className={styles.listEmpty}>
                  Нема зделки во оваа фаза.
                  {OPEN_STAGES.some((s) => s.key === stage) && (
                    <button className={styles.linkBtn} onClick={openCreate}>Додади контакт →</button>
                  )}
                </div>
              ) : (
                <div className={styles.dealList}>
                  {deals.map((d) => {
                    const tone = actionTone(d);
                    return (
                      <article key={d._id} className={styles.deal}>
                        <div className={styles.dealTop}>
                          <h3 className={styles.dealName}>{d.name}</h3>
                          {fmtEUR(d.value) && <span className={styles.dealValue}>{fmtEUR(d.value)}</span>}
                        </div>

                        {(d.contact?.person || d.contact?.email || d.contact?.phone) && (
                          <div className={styles.dealContact}>
                            {[d.contact.person, d.contact.email, d.contact.phone].filter(Boolean).join(' · ')}
                          </div>
                        )}

                        {d.nextActionAt && (
                          <div className={`${styles.dealAction} ${styles['action_' + tone]}`}>
                            {tone === 'overdue' ? '⚠ ' : '📅 '}
                            {fmtDate(d.nextActionAt)}
                            {d.nextActionNote ? ` — ${d.nextActionNote}` : ''}
                          </div>
                        )}

                        {d.note && <p className={styles.dealNote}>{d.note}</p>}
                        {stage === 'lost' && d.lostReason && (
                          <p className={styles.dealNote}>Причина: {d.lostReason}</p>
                        )}

                        <div className={styles.dealActions}>
                          {NEXT_OF[d.stage] && (
                            <button
                              className={styles.advanceBtn}
                              onClick={() => moveStage(d, NEXT_OF[d.stage])}
                            >
                              {NEXT_LABEL[d.stage]}
                            </button>
                          )}
                          {OPEN_STAGES.some((s) => s.key === d.stage) && (
                            losing?.id === d._id ? (
                              <span className={styles.loseForm}>
                                <input
                                  autoFocus
                                  className={styles.loseInput}
                                  placeholder="Причина (опционално)"
                                  value={losing.reason}
                                  onChange={(e) => setLosing({ id: d._id, reason: e.target.value })}
                                  onKeyDown={(e) => { if (e.key === 'Enter') moveStage(d, 'lost', losing.reason); }}
                                />
                                <button className={styles.loseConfirm} onClick={() => moveStage(d, 'lost', losing.reason)}>Потврди</button>
                                <button className={styles.ghostBtn} onClick={() => setLosing(null)}>Откажи</button>
                              </span>
                            ) : (
                              <button className={styles.ghostBtn} onClick={() => setLosing({ id: d._id, reason: '' })}>
                                Изгубена
                              </button>
                            )
                          )}
                          {stage === 'lost' && (
                            <button className={styles.ghostBtn} onClick={() => moveStage(d, 'potential')}>
                              ↩ Врати во инка
                            </button>
                          )}
                          <span className={styles.dealActionsRight}>
                            <button className={styles.ghostBtn} onClick={() => openEdit(d)}>Уреди</button>
                            {confirmDelete === d._id ? (
                              <>
                                <button className={styles.dangerBtn} onClick={() => removeDeal(d._id)}>Потврди бришење</button>
                                <button className={styles.ghostBtn} onClick={() => setConfirmDelete(null)}>Откажи</button>
                              </>
                            ) : (
                              <button className={styles.ghostBtn} onClick={() => setConfirmDelete(d._id)}>Избриши</button>
                            )}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- Create / edit modal ---- */}
        {modal && (
          <div className={styles.modalOverlay} onClick={() => !saving && setModal(null)}>
            <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={saveModal}>
              <h2 className={styles.modalTitle}>{modal.id ? 'Уреди зделка' : 'Нов контакт'}</h2>
              {modalError && <div className={styles.error}>{modalError}</div>}

              <label className={styles.field}>
                <span>Компанија / контакт *</span>
                <input value={modal.form.name} onChange={(e) => setF('name', e.target.value)} autoFocus />
              </label>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>Лице за контакт</span>
                  <input value={modal.form.person} onChange={(e) => setF('person', e.target.value)} />
                </label>
                <label className={styles.field}>
                  <span>Вредност (€)</span>
                  <input type="number" min="0" step="1" value={modal.form.value} onChange={(e) => setF('value', e.target.value)} />
                </label>
              </div>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>Е-пошта</span>
                  <input type="email" value={modal.form.email} onChange={(e) => setF('email', e.target.value)} />
                </label>
                <label className={styles.field}>
                  <span>Телефон</span>
                  <input value={modal.form.phone} onChange={(e) => setF('phone', e.target.value)} />
                </label>
              </div>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>Фаза</span>
                  <select value={modal.form.stage} onChange={(e) => setF('stage', e.target.value)}>
                    {[...OPEN_STAGES, ...OUTCOMES].map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Следна активност</span>
                  <input type="date" value={modal.form.nextActionAt} onChange={(e) => setF('nextActionAt', e.target.value)} />
                </label>
              </div>

              <label className={styles.field}>
                <span>Опис на следната активност</span>
                <input
                  placeholder="пр. Јави се за повратна информација за понудата"
                  value={modal.form.nextActionNote}
                  onChange={(e) => setF('nextActionNote', e.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>Белешка</span>
                <textarea rows={3} value={modal.form.note} onChange={(e) => setF('note', e.target.value)} />
              </label>

              <div className={styles.modalActions}>
                <button type="button" className={styles.ghostBtn} disabled={saving} onClick={() => setModal(null)}>Откажи</button>
                <button type="submit" className={styles.primaryBtn} disabled={saving}>
                  {saving ? 'Се зачувува…' : (modal.id ? 'Зачувај' : 'Додади')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </TerminalShell>
  );
}

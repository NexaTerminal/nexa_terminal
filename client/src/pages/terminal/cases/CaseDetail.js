import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import casesApi from '../../../services/casesApi';
import base from '../contracts/Contracts.module.css';
import ui from './CaseDetail.module.css';
import {
  CASE_TYPE_LABEL, STATUS_LABEL, PRIORITY_LABEL,
  DEADLINE_TYPE_LABEL, DEADLINE_TYPE_OPTIONS,
  TIMELINE_TYPE_LABEL, TIMELINE_TYPE_OPTIONS,
  fmtDate, dueLabel, daysLeft, publicCaseUrl
} from '../../../config/cases';

const EMPTY_DEADLINE = { title: '', type: 'rociste', dueAt: '', remind: true, clientVisible: false };
const EMPTY_ENTRY = { title: '', type: 'napomena', at: '', body: '', clientVisible: false };

export default function CaseDetail() {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [kase, setKase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [dl, setDl] = useState(EMPTY_DEADLINE);
  const [entry, setEntry] = useState(EMPTY_ENTRY);
  const [aiNotes, setAiNotes] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await casesApi.get(token, id);
      setKase(res.item);
    } catch (err) {
      setError(err.response?.data?.message || 'Предметот не може да се вчита.');
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => { load(); }, [load]);

  const publicUrl = kase ? publicCaseUrl(kase.publicToken) : '';

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(publicUrl); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    catch { /* clipboard unavailable — user can select manually */ }
  };

  const togglePublic = async () => {
    try { const res = await casesApi.setPublic(token, id, !kase.publicEnabled); setKase(res.item); }
    catch (err) { setError(err.response?.data?.message || 'Грешка.'); }
  };

  const changeStatus = async (e) => {
    const status = e.target.value;
    try { const res = await casesApi.update(token, id, { ...kase, status, clientId: kase.clientId || null }); setKase(res.item); }
    catch (err) { setError(err.response?.data?.message || 'Грешка при промена на статус.'); }
  };

  const removeCase = async () => {
    if (!window.confirm('Дали сте сигурни дека сакате да го избришете предметот? Ова е неповратно.')) return;
    try { await casesApi.remove(token, id); navigate('/terminal/cases'); }
    catch (err) { setError(err.response?.data?.message || 'Грешка при бришење.'); }
  };

  // ── Deadlines ────────────────────────────────────────────────────────────
  const addDeadline = async (e) => {
    e.preventDefault();
    if (!dl.title.trim() || !dl.dueAt) { setError('Внесете наслов и датум за рокот.'); return; }
    setBusy(true); setError('');
    try { const res = await casesApi.addDeadline(token, id, dl); setKase(res.item); setDl(EMPTY_DEADLINE); }
    catch (err) { setError(err.response?.data?.message || 'Грешка.'); }
    finally { setBusy(false); }
  };

  const patchDeadline = async (d, patch) => {
    try {
      const res = await casesApi.updateDeadline(token, id, d._id, {
        title: d.title, type: d.type, dueAt: d.dueAt, done: d.done, remind: d.remind, clientVisible: d.clientVisible, ...patch
      });
      setKase(res.item);
    } catch (err) { setError(err.response?.data?.message || 'Грешка.'); }
  };

  const delDeadline = async (d) => {
    try { const res = await casesApi.removeDeadline(token, id, d._id); setKase(res.item); }
    catch (err) { setError(err.response?.data?.message || 'Грешка.'); }
  };

  // ── Timeline ─────────────────────────────────────────────────────────────
  const runAi = async () => {
    if (!aiNotes.trim()) return;
    setAiBusy(true); setError('');
    try {
      const res = await casesApi.aiBrief(token, id, aiNotes);
      setAiResult({ summary: res.summary || '', clientSummary: res.clientSummary || '' });
    } catch (err) { setError(err.response?.data?.message || 'AI не е достапен во моментов.'); }
    finally { setAiBusy(false); }
  };

  const applyAi = (which) => {
    if (!aiResult) return;
    if (which === 'summary') setEntry((s) => ({ ...s, body: aiResult.summary }));
    else setEntry((s) => ({ ...s, body: aiResult.clientSummary, clientVisible: true }));
  };

  const addEntry = async (e) => {
    e.preventDefault();
    if (!entry.title.trim() && !entry.body.trim()) { setError('Внесете опис на активноста.'); return; }
    setBusy(true); setError('');
    try {
      const res = await casesApi.addEntry(token, id, entry);
      setKase(res.item);
      setEntry(EMPTY_ENTRY); setAiNotes(''); setAiResult(null);
    } catch (err) { setError(err.response?.data?.message || 'Грешка.'); }
    finally { setBusy(false); }
  };

  const patchEntry = async (en, patch) => {
    try {
      const res = await casesApi.updateEntry(token, id, en._id, {
        title: en.title, body: en.body, type: en.type, at: en.at, clientVisible: en.clientVisible, ...patch
      });
      setKase(res.item);
    } catch (err) { setError(err.response?.data?.message || 'Грешка.'); }
  };

  const delEntry = async (en) => {
    try { const res = await casesApi.removeEntry(token, id, en._id); setKase(res.item); }
    catch (err) { setError(err.response?.data?.message || 'Грешка.'); }
  };

  if (loading) return <TerminalShell><div className={base.page}><p>Се вчитува…</p></div></TerminalShell>;
  if (!kase) return <TerminalShell><div className={base.page}><p className={base.error}>{error || 'Предметот не е пронајден.'}</p><Link to="/terminal/cases" className={base.secondaryBtn}>← Назад</Link></div></TerminalShell>;

  const deadlines = [...(kase.deadlines || [])].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  const timeline = [...(kase.timeline || [])].sort((a, b) => new Date(b.at) - new Date(a.at));

  const fieldFull = `${base.field} ${base.fieldFull}`;

  return (
    <TerminalShell>
      <div className={base.page}>
        {/* Hero — everything identifying at a glance */}
        <div className={ui.hero} data-status={kase.status}>
          <div className={ui.heroMain}>
            <h1 className={ui.heroTitle}>{kase.title}</h1>
            <p className={ui.heroSub}>{CASE_TYPE_LABEL[kase.caseType]} · {kase.clientName || 'без клиент'}</p>
            <div className={ui.chips}>
              {kase.internalNumber && <span className={ui.chip}><span className={ui.chipKey}>Внат. бр.</span>{kase.internalNumber}</span>}
              {kase.caseNumber && <span className={`${ui.chip} ${ui.chipStrong}`}><span className={ui.chipKey}>Служ. бр.</span>{kase.caseNumber}</span>}
              {kase.courtName && <span className={ui.chip}><span className={ui.chipKey}>Суд</span>{kase.courtName}</span>}
            </div>
          </div>
          <div className={ui.heroActions}>
            <select className={ui.statusSelect} value={kase.status} onChange={changeStatus}>
              {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <Link to={`/terminal/cases/${id}/edit`} className={base.secondaryBtn}>Измени</Link>
            <Link to="/terminal/cases" className={base.secondaryBtn}>← Назад</Link>
          </div>
        </div>

        {error && <p className={base.error}>{error}</p>}

        <div className={ui.grid}>
          {/* LEFT — the working surface: deadlines + timeline */}
          <div className={ui.colStack}>
            <div className={ui.panel}>
              <div className={ui.panelHead}>
                <h2 className={ui.panelTitle}>Рокови</h2>
                <span className={ui.count}>{deadlines.length}</span>
              </div>
              {deadlines.length === 0 ? (
                <p className={base.hint}>Нема внесени рокови.</p>
              ) : deadlines.map((d) => {
                const n = daysLeft(d.dueAt);
                const overdue = !d.done && n !== null && n < 0;
                return (
                  <div key={d._id} className={ui.item}>
                    <div className={ui.itemMain}>
                      <span className={`${ui.itemTitle} ${d.done ? ui.itemTitleDone : ''}`}>{d.title}</span>
                      <div className={ui.itemSub}>
                        {DEADLINE_TYPE_LABEL[d.type]} · {fmtDate(d.dueAt)}
                        {!d.done && <> · <strong className={overdue ? ui.overdue : undefined}>{dueLabel(d.dueAt)}</strong></>}
                      </div>
                      <div className={ui.itemBadges}>
                        {d.done && <span className={`${ui.tag} ${ui.tagMuted}`}>Завршено</span>}
                        <span className={`${ui.tag} ${d.remind ? '' : ui.tagMuted}`}>{d.remind ? 'Потсетник вкл.' : 'Без потсетник'}</span>
                        <span className={`${ui.tag} ${d.clientVisible ? ui.tagVisible : ui.tagMuted}`}>{d.clientVisible ? 'Видлив за клиент' : 'Скриен'}</span>
                      </div>
                    </div>
                    <div className={ui.itemActions}>
                      <button type="button" className={base.smallBtn} onClick={() => patchDeadline(d, { done: !d.done })}>{d.done ? 'Врати' : 'Заврши'}</button>
                      <button type="button" className={base.smallBtn} onClick={() => patchDeadline(d, { clientVisible: !d.clientVisible })}>{d.clientVisible ? 'Сокриј' : 'Покажи'}</button>
                      <button type="button" className={base.dangerBtn} onClick={() => delDeadline(d)}>×</button>
                    </div>
                  </div>
                );
              })}

              <form className={ui.addForm} onSubmit={addDeadline}>
                <div className={base.formGrid}>
                  <div className={fieldFull}>
                    <label className={base.label}>Нов рок</label>
                    <input className={base.input} placeholder="пр. Рочиште / Рок за жалба" value={dl.title} onChange={(e) => setDl((s) => ({ ...s, title: e.target.value }))} />
                  </div>
                  <div className={base.field}>
                    <label className={base.label}>Вид</label>
                    <select className={base.input} value={dl.type} onChange={(e) => setDl((s) => ({ ...s, type: e.target.value }))}>
                      {DEADLINE_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className={base.field}>
                    <label className={base.label}>Датум</label>
                    <input type="date" className={base.input} value={dl.dueAt} onChange={(e) => setDl((s) => ({ ...s, dueAt: e.target.value }))} />
                  </div>
                </div>
                <div className={ui.checkRow}>
                  <label className={ui.check}><input type="checkbox" checked={dl.remind} onChange={(e) => setDl((s) => ({ ...s, remind: e.target.checked }))} /> Потсети ме (7, 3 и 1 ден претходно)</label>
                  <label className={ui.check}><input type="checkbox" checked={dl.clientVisible} onChange={(e) => setDl((s) => ({ ...s, clientVisible: e.target.checked }))} /> Видливо за клиентот</label>
                </div>
                <button type="submit" className={base.primaryBtn} disabled={busy}>Додај рок</button>
              </form>
            </div>

            <div className={ui.panel}>
              <div className={ui.panelHead}>
                <h2 className={ui.panelTitle}>Дневник на активности</h2>
                <span className={ui.count}>{timeline.length}</span>
              </div>
              <div className={ui.timeline}>
                {timeline.length === 0 ? (
                  <p className={base.hint}>Нема внесени активности.</p>
                ) : timeline.map((en) => (
                  <div key={en._id} className={`${ui.item} ${ui.tlItem}`}>
                    <div className={ui.itemMain}>
                      <span className={ui.itemTitle}>{en.title || TIMELINE_TYPE_LABEL[en.type]}</span>
                      <div className={ui.itemSub}>{TIMELINE_TYPE_LABEL[en.type]} · {fmtDate(en.at)}</div>
                      {en.body && <div className={ui.itemBody}>{en.body}</div>}
                      <div className={ui.itemBadges}>
                        <span className={`${ui.tag} ${en.clientVisible ? ui.tagVisible : ui.tagMuted}`}>{en.clientVisible ? 'Видлив за клиент' : 'Интерно'}</span>
                      </div>
                    </div>
                    <div className={ui.itemActions}>
                      <button type="button" className={base.smallBtn} onClick={() => patchEntry(en, { clientVisible: !en.clientVisible })}>{en.clientVisible ? 'Сокриј' : 'Покажи'}</button>
                      <button type="button" className={base.dangerBtn} onClick={() => delEntry(en)}>×</button>
                    </div>
                  </div>
                ))}
              </div>

              <form className={ui.addForm} onSubmit={addEntry}>
                <div className={base.formGrid}>
                  <div className={base.field}>
                    <label className={base.label}>Наслов</label>
                    <input className={base.input} placeholder="пр. Одржано рочиште" value={entry.title} onChange={(e) => setEntry((s) => ({ ...s, title: e.target.value }))} />
                  </div>
                  <div className={base.field}>
                    <label className={base.label}>Вид</label>
                    <select className={base.input} value={entry.type} onChange={(e) => setEntry((s) => ({ ...s, type: e.target.value }))}>
                      {TIMELINE_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className={base.field}>
                    <label className={base.label}>Датум</label>
                    <input type="date" className={base.input} value={entry.at} onChange={(e) => setEntry((s) => ({ ...s, at: e.target.value }))} />
                  </div>
                  <div className={fieldFull}>
                    <label className={base.label}>Опис</label>
                    <textarea className={base.textarea} value={entry.body} onChange={(e) => setEntry((s) => ({ ...s, body: e.target.value }))} />
                  </div>
                </div>

                {/* AI brief helper */}
                <div className={ui.aiBox}>
                  <span className={ui.aiLabel}>AI помош — состави краток опис</span>
                  <p className={base.hint}>Внесете груби белешки; AI составува уредно резиме и верзија за клиент.</p>
                  <textarea className={base.textarea} placeholder="пр. отидов на суд, одложено поради отсуство на сведок, ново рочиште 15.09" value={aiNotes} onChange={(e) => setAiNotes(e.target.value)} />
                  <button type="button" className={base.secondaryBtn} onClick={runAi} disabled={aiBusy || !aiNotes.trim()}>
                    {aiBusy ? 'Се составува…' : 'Состави со AI'}
                  </button>
                  {aiResult && (
                    <>
                      <div className={ui.aiResult}>
                        <span className={ui.aiLabel}>Резиме (интерно)</span>
                        <div>{aiResult.summary}</div>
                        <button type="button" className={`${base.smallBtn} ${ui.aiActed}`} onClick={() => applyAi('summary')}>Стави во опис</button>
                      </div>
                      {aiResult.clientSummary && (
                        <div className={ui.aiResult}>
                          <span className={ui.aiLabel}>Верзија за клиент</span>
                          <div>{aiResult.clientSummary}</div>
                          <button type="button" className={`${base.smallBtn} ${ui.aiActed}`} onClick={() => applyAi('client')}>Стави за клиент</button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className={ui.checkRow}>
                  <label className={ui.check}><input type="checkbox" checked={entry.clientVisible} onChange={(e) => setEntry((s) => ({ ...s, clientVisible: e.target.checked }))} /> Видливо за клиентот</label>
                </div>
                <button type="submit" className={base.primaryBtn} disabled={busy}>Додај активност</button>
              </form>
            </div>
          </div>

          {/* RIGHT — the reference column: public link, details, notes */}
          <div className={ui.colStack}>
            <div className={ui.panel}>
              <div className={ui.panelHead}>
                <h2 className={ui.panelTitle}>Јавен линк за клиентот</h2>
                <span className={`${base.badge} ${kase.publicEnabled ? base.badge_active : base.badge_terminated}`}>
                  {kase.publicEnabled ? 'Активен' : 'Исклучен'}
                </span>
              </div>
              <p className={base.hint}>
                Клиентот гледа само статус, следен рок и активности означени како видливи —
                никогаш интерни белешки. Линкот важи додека предметот е отворен.
              </p>
              <div className={ui.publicBox}>
                <span className={`${ui.publicUrl} ${kase.publicEnabled ? '' : ui.publicOff}`}>{publicUrl}</span>
                <div className={ui.publicActions}>
                  <button type="button" className={base.smallBtn} onClick={copyLink}>{copied ? 'Копирано ✓' : 'Копирај'}</button>
                  <a className={base.smallBtn} href={publicUrl} target="_blank" rel="noreferrer">Отвори</a>
                  <button type="button" className={base.smallBtn} onClick={togglePublic}>{kase.publicEnabled ? 'Исклучи' : 'Вклучи'}</button>
                </div>
              </div>
            </div>

            <div className={ui.panel}>
              <div className={ui.panelHead}><h2 className={ui.panelTitle}>Детали</h2></div>
              <div className={ui.rows}>
                <div className={ui.row}><span className={ui.rowKey}>Приоритет</span><span className={ui.rowVal}>{PRIORITY_LABEL[kase.priority]}</span></div>
                <div className={ui.row}><span className={ui.rowKey}>Вредност</span><span className={ui.rowVal}>{kase.value || '—'}</span></div>
                <div className={ui.row}><span className={ui.rowKey}>Спротивна страна</span><span className={ui.rowVal}>{kase.opposingParty || '—'}</span></div>
                {kase.clientEmail && <div className={ui.row}><span className={ui.rowKey}>Е-пошта</span><span className={ui.rowVal}>{kase.clientEmail}</span></div>}
                <div className={ui.row}><span className={ui.rowKey}>Отворен</span><span className={ui.rowVal}>{fmtDate(kase.openedAt)}</span></div>
              </div>
              {kase.description && <p className={ui.desc}>{kase.description}</p>}
            </div>

            {kase.internalNotes && (
              <div className={ui.panel}>
                <div className={ui.panelHead}><h2 className={ui.panelTitle}>Интерни белешки</h2></div>
                <div className={ui.notes}>{kase.internalNotes}</div>
              </div>
            )}

            <div className={ui.panel}>
              <button type="button" className={base.dangerBtn} onClick={removeCase}>Избриши предмет</button>
            </div>
          </div>
        </div>
      </div>
    </TerminalShell>
  );
}

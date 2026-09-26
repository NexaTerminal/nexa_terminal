import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import interviewApi from '../../services/interviewApi';
import s from './Interviews.module.css';

/**
 * „Интервјуа" — owner cockpit for one interview type.
 *   type='scan' → Интервју скен (candidate soft-skill screen)
 *   type='exit' → Излезно интервју (departing-employee exit interview)
 * Rendered at /terminal/interviews/scan and /terminal/interviews/exit.
 * Create → edit the suggested questions → share link/email → read transcript + AI summary.
 * Basic + Pro HR tool (subscriptionGuard on the API).
 */

const COPY = {
  scan: {
    eyebrow: 'HR алатки',
    title: 'Интервју скен',
    lead: 'Испратете кратки прашања до кандидат пред разговорот — за да ги согледате меките вештини и карактерот. По одговорот добивате преглед со AI резиме.',
    subjectLabel: 'Име на кандидат *',
    subjectPh: 'пр. Марко Марковски',
  },
  exit: {
    eyebrow: 'HR алатки',
    title: 'Излезно интервју',
    lead: 'Испратете структурирано излезно интервју до вработен што заминува — за да разберете зошто и како да го подобрите задржувањето. По одговорот добивате преглед со AI резиме.',
    subjectLabel: 'Име на вработен *',
    subjectPh: 'пр. Ана Анеска',
  },
};

const fmt = (d) => (d ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const uidTmp = () => 'q_' + Math.random().toString(16).slice(2, 10);

/* ── Editable question list ─────────────────────────────────────────────── */
function QuestionEditor({ questions, setQuestions }) {
  const update = (i, patch) => setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const remove = (i) => setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  const move = (i, dir) => setQuestions((qs) => {
    const j = i + dir;
    if (j < 0 || j >= qs.length) return qs;
    const copy = [...qs];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  });
  const add = () => setQuestions((qs) => (qs.length >= 15 ? qs : [...qs, { id: uidTmp(), text: '', kind: 'text' }]));

  return (
    <div className={s.qEditor}>
      {questions.map((q, i) => (
        <div key={q.id} className={s.qRow}>
          <span className={s.qNum}>{i + 1}</span>
          <div className={s.qBody}>
            <textarea
              className={s.qText}
              rows={2}
              maxLength={400}
              value={q.text}
              placeholder="Внесете прашање…"
              onChange={(e) => update(i, { text: e.target.value })}
            />
            <div className={s.qControls}>
              <div className={s.kindToggle}>
                <button type="button"
                  className={`${s.kindBtn} ${q.kind === 'text' ? s.kindActive : ''}`}
                  onClick={() => update(i, { kind: 'text' })}>Текст</button>
                <button type="button"
                  className={`${s.kindBtn} ${q.kind === 'rating' ? s.kindActive : ''}`}
                  onClick={() => update(i, { kind: 'rating' })}>Оценка 1–5</button>
              </div>
              <div className={s.qMove}>
                <button type="button" className={s.iconBtn} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Нагоре">↑</button>
                <button type="button" className={s.iconBtn} disabled={i === questions.length - 1} onClick={() => move(i, 1)} aria-label="Надолу">↓</button>
                <button type="button" className={s.iconBtnDanger} onClick={() => remove(i)} aria-label="Избриши">✕</button>
              </div>
            </div>
            {/* Preview of how a rating question looks to the respondent, so the
                owner sees the 1–5 scale the moment they switch to „Оценка". */}
            {q.kind === 'rating' && (
              <div className={s.ratingPreview}>
                <span className={s.ratingPreviewLabel}>Вработениот ќе избере оценка:</span>
                <div className={s.ratingPreviewScale}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className={s.ratingPreviewBtn}>{n}</span>
                  ))}
                  <span className={s.ratingPreviewHint}>1 = најмалку · 5 = најмногу</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      <button type="button" className={s.btnGhost} onClick={add} disabled={questions.length >= 15}>
        + Додади прашање {questions.length >= 15 && '(макс. 15)'}
      </button>
    </div>
  );
}

/* ── AI summary + transcript for a completed interview ──────────────────── */
function RatingDots({ value }) {
  const n = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span className={s.dots}>
      {[1, 2, 3, 4, 5].map((i) => <span key={i} className={`${s.dot} ${i <= n ? s.dotOn : ''}`} />)}
      <span className={s.dotNum}>{n}/5</span>
    </span>
  );
}

function AiSummary({ aiSummary }) {
  const parsed = useMemo(() => {
    if (!aiSummary?.text) return null;
    try { return JSON.parse(aiSummary.text); } catch { return null; }
  }, [aiSummary]);
  if (!parsed) return null;
  const List = ({ title, items }) => (Array.isArray(items) && items.length) ? (
    <div className={s.aiGroup}>
      <div className={s.aiGroupTitle}>{title}</div>
      <ul className={s.aiList}>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </div>
  ) : null;
  return (
    <div className={s.aiCard}>
      <div className={s.aiBadge}>AI резиме</div>
      {parsed.summary && <p className={s.aiSummaryText}>{parsed.summary}</p>}
      <List title="Силни страни" items={parsed.strengths} />
      <List title="За проверка" items={parsed.watchouts} />
      <List title="Теми" items={parsed.themes} />
      <List title="Предлози" items={parsed.actions} />
    </div>
  );
}

function Transcript({ detail }) {
  const answers = detail.answers || {};
  return (
    <div className={s.transcript}>
      <AiSummary aiSummary={detail.aiSummary} />
      <div className={s.qaHead}>Одговори</div>
      {(detail.questions || []).map((q, i) => (
        <div key={q.id} className={s.qaItem}>
          <div className={s.qaQ}>{i + 1}. {q.text}</div>
          <div className={s.qaA}>
            {q.kind === 'rating'
              ? <RatingDots value={answers[q.id]} />
              : (answers[q.id] ? answers[q.id] : <span className={s.qaEmpty}>(без одговор)</span>)}
          </div>
        </div>
      ))}
      {detail.resultsEmailedAt && (
        <p className={s.emailedNote}>✓ Преглед е испратен на вашата е-пошта{detail.resultsEmailedTo ? ` (${detail.resultsEmailedTo})` : ''}.</p>
      )}
    </div>
  );
}

export default function Interviews({ type = 'scan' }) {
  const { token } = useAuth();
  const copy = COPY[type] || COPY.scan;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ subjectName: '', role: '', inviteEmail: '', note: '' });
  const [questions, setQuestions] = useState([]);
  const [qLoading, setQLoading] = useState(true);
  const [savingTpl, setSavingTpl] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(null);

  const notify = (t, text) => { setToast({ type: t, text }); setTimeout(() => setToast(null), 4000); };

  const load = useCallback(() => {
    setLoading(true);
    interviewApi.list(token, type)
      .then((d) => setItems(d.items || []))
      .catch(() => notify('err', 'Не може да се вчита листата.'))
      .finally(() => setLoading(false));
  }, [token, type]);

  const loadSuggestions = useCallback((role) => {
    setQLoading(true);
    interviewApi.suggest(token, type, role)
      .then((d) => setQuestions(d.questions || []))
      .catch(() => notify('err', 'Прашањата не се вчитаа.'))
      .finally(() => setQLoading(false));
  }, [token, type]);

  // Reset everything when switching type (scan ⇄ exit share this component).
  useEffect(() => {
    setForm({ subjectName: '', role: '', inviteEmail: '', note: '' });
    setOpenId(null); setDetail(null);
    load();
    loadSuggestions('');
  }, [type, load, loadSuggestions]);

  const submitCreate = async (e) => {
    e.preventDefault();
    if (!form.subjectName.trim()) { notify('err', 'Внесете име.'); return; }
    const clean = questions.filter((q) => q.text.trim());
    if (!clean.length) { notify('err', 'Додадете барем едно прашање.'); return; }
    setCreating(true);
    try {
      const res = await interviewApi.create(token, { type, ...form, questions: clean });
      setItems((prev) => [res.item, ...prev]);
      setForm({ subjectName: '', role: '', inviteEmail: '', note: '' });
      notify('ok', res.emailed ? 'Интервјуто е креирано и поканата е испратена.' : 'Интервјуто е креирано. Копирајте го линкот подолу.');
    } catch (ex) {
      notify('err', ex.response?.data?.message || 'Грешка при креирање.');
    } finally {
      setCreating(false);
    }
  };

  const saveDefault = async () => {
    const clean = questions.filter((q) => q.text.trim());
    if (!clean.length) { notify('err', 'Додадете барем едно прашање.'); return; }
    setSavingTpl(true);
    try {
      await interviewApi.saveTemplate(token, type, clean);
      notify('ok', 'Зачувано како ваш стандарден образец.');
    } catch (_) {
      notify('err', 'Зачувувањето не успеа.');
    } finally {
      setSavingTpl(false);
    }
  };

  const copyLink = async (item) => {
    try {
      await navigator.clipboard.writeText(item.link);
      setCopied(item.id);
      setTimeout(() => setCopied(null), 2000);
    } catch (_) { notify('err', 'Копирањето не успеа.'); }
  };

  const resend = async (item) => {
    const email = item.inviteEmail || window.prompt('Е-пошта за испраќање на линкот:');
    if (!email) return;
    try {
      const r = await interviewApi.resend(token, item.id, email);
      if (r.emailed) { notify('ok', `Поканата е испратена на ${email}.`); load(); }
      else notify('err', 'Испраќањето не успеа.');
    } catch (ex) { notify('err', ex.response?.data?.message || 'Испраќањето не успеа.'); }
  };

  const remove = async (item) => {
    if (!window.confirm(`Да го избришам интервјуто за „${item.subjectName}“?`)) return;
    try {
      await interviewApi.remove(token, item.id);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      if (openId === item.id) { setOpenId(null); setDetail(null); }
      notify('ok', 'Избришано.');
    } catch (_) { notify('err', 'Бришењето не успеа.'); }
  };

  const openReport = async (item) => {
    if (openId === item.id) { setOpenId(null); setDetail(null); return; }
    setOpenId(item.id); setDetail(null);
    try {
      const d = await interviewApi.get(token, item.id);
      setDetail(d.item);
    } catch (_) { notify('err', 'Прегледот не може да се вчита.'); }
  };

  const counts = useMemo(() => ({
    completed: items.filter((i) => i.status === 'completed').length,
    pending: items.filter((i) => i.status === 'pending').length,
  }), [items]);

  return (
    <TerminalShell>
      <div className={s.page}>
        <header className={s.header}>
          <span className={s.eyebrow}>{copy.eyebrow}</span>
          <h1 className={s.title}>{copy.title}</h1>
          <p className={s.lead}>{copy.lead}</p>
        </header>

        {toast && <div className={toast.type === 'ok' ? s.toastOk : s.toastErr}>{toast.text}</div>}

        {/* Create */}
        <form className={s.createCard} onSubmit={submitCreate}>
          <h2 className={s.cardTitle}>Ново интервју</h2>
          <div className={s.formGrid}>
            <label className={s.field}>
              <span className={s.fieldLabel}>{copy.subjectLabel}</span>
              <input className={s.input} value={form.subjectName} maxLength={120}
                     onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
                     placeholder={copy.subjectPh} />
            </label>
            <label className={s.field}>
              <span className={s.fieldLabel}>Позиција (опционално)</span>
              <input className={s.input} value={form.role} maxLength={120}
                     onChange={(e) => setForm({ ...form, role: e.target.value })}
                     placeholder="пр. Комерцијалист" />
            </label>
            <label className={s.field}>
              <span className={s.fieldLabel}>Е-пошта за покана (опционално)</span>
              <input className={s.input} type="email" value={form.inviteEmail} maxLength={160}
                     onChange={(e) => setForm({ ...form, inviteEmail: e.target.value })}
                     placeholder="ако сакате да го испратиме линкот" />
            </label>
            <label className={s.field}>
              <span className={s.fieldLabel}>Приватна белешка (опционално)</span>
              <input className={s.input} value={form.note} maxLength={500}
                     onChange={(e) => setForm({ ...form, note: e.target.value })}
                     placeholder="само за вас" />
            </label>
          </div>

          <div className={s.qHead}>
            <span className={s.cardTitle}>Прашања (можете да ги менувате)</span>
            <div className={s.qHeadActions}>
              <button type="button" className={s.linkBtn} onClick={() => loadSuggestions(form.role.trim())}>
                Врати предложени
              </button>
              <button type="button" className={s.linkBtn} onClick={saveDefault} disabled={savingTpl}>
                {savingTpl ? 'Се зачувува…' : 'Зачувај како мој образец'}
              </button>
            </div>
          </div>
          {qLoading
            ? <div className={s.empty}>Се вчитуваат прашањата…</div>
            : <QuestionEditor questions={questions} setQuestions={setQuestions} />}

          <button type="submit" className={s.btnPrimary} disabled={creating}>
            {creating ? 'Се креира…' : 'Креирај и подготви линк'}
          </button>
        </form>

        {/* List */}
        <div className={s.listHead}>
          <h2 className={s.cardTitle}>{type === 'exit' ? 'Мои излезни интервјуа' : 'Мои интервјуа'}</h2>
          {!loading && <span className={s.countPill}>{counts.completed} завршени · {counts.pending} во тек</span>}
        </div>

        {loading ? (
          <div className={s.empty}>Се вчитува…</div>
        ) : items.length === 0 ? (
          <div className={s.empty}>Сè уште немате интервјуа. Креирајте го првото погоре.</div>
        ) : (
          <div className={s.list}>
            {items.map((item) => (
              <div key={item.id} className={s.row}>
                <div className={s.rowMain}>
                  <div className={s.rowTitleWrap}>
                    <span className={s.rowName}>{item.subjectName}</span>
                    {item.role ? <span className={s.rowRole}>· {item.role}</span> : null}
                  </div>
                  <div className={s.rowMeta}>
                    <span className={item.status === 'completed' ? s.stDone : s.stPending}>
                      {item.status === 'completed' ? 'Завршено' : 'Чека одговор'}
                    </span>
                    <span className={s.rowDate}>Креирано {fmt(item.createdAt)}</span>
                    {item.completedAt ? <span className={s.rowDate}>· Одговорено {fmt(item.completedAt)}</span> : null}
                  </div>
                </div>

                <div className={s.rowActions}>
                  {item.status === 'completed' ? (
                    <button type="button" className={s.btnAccent} onClick={() => openReport(item)}>
                      {openId === item.id ? 'Сокриј преглед' : 'Види преглед'}
                    </button>
                  ) : (
                    <>
                      <button type="button" className={s.btnGhost} onClick={() => copyLink(item)}>
                        {copied === item.id ? 'Копирано ✓' : 'Копирај линк'}
                      </button>
                      <button type="button" className={s.btnGhost} onClick={() => resend(item)}>
                        {item.inviteEmail ? 'Испрати повторно' : 'Испрати по е-пошта'}
                      </button>
                    </>
                  )}
                  <button type="button" className={s.btnDangerGhost} onClick={() => remove(item)} aria-label="Избриши">✕</button>
                </div>

                {openId === item.id && (
                  <div className={s.reportPanel}>
                    {detail ? <Transcript detail={detail} /> : <div className={s.empty}>Се вчитува прегледот…</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </TerminalShell>
  );
}

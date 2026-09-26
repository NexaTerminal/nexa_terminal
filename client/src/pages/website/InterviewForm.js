import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import Icon from '../../components/website/Icon';
import s from './InterviewForm.module.css';

/**
 * „Интервјуа" — public respondent page (no login). A candidate/employee opens
 * their personal link, answers the interview questions (free-text + 1–5 ratings),
 * and submits. They only ever see a thank-you — the employer gets the transcript.
 * Everything is validated/stored server-side (/api/public/interview).
 */
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

const TITLE = { scan: 'Интервју', exit: 'Излезно интервју' };

export default function InterviewForm() {
  const { token } = useParams();
  const [phase, setPhase] = useState('loading'); // loading | intro | form | done | completed | notfound | error
  const [meta, setMeta] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [website, setWebsite] = useState(''); // honeypot
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/public/interview/${token}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (cancelled) return;
        if (!ok || !d?.success) { setPhase('notfound'); return; }
        if (d.status === 'completed') { setPhase('completed'); return; }
        setMeta(d.data);
        setQuestions(d.data?.questions || []);
        setPhase('intro');
      })
      .catch(() => { if (!cancelled) setPhase('error'); });
    return () => { cancelled = true; };
  }, [token]);

  const setAnswer = (id, value) => setAnswers((prev) => ({ ...prev, [id]: value }));

  const answeredCount = questions.filter((q) => {
    const v = answers[q.id];
    return v != null && String(v).trim() !== '';
  }).length;
  const enough = questions.length > 0 && answeredCount >= Math.ceil(questions.length / 2);

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/public/interview/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, website }),
      });
      const data = await res.json();
      if (res.status === 409) { setPhase('completed'); return; }
      if (!res.ok || !data.success) throw new Error(data.message || 'Грешка');
      setPhase('done');
    } catch (ex) {
      setError(ex.message || 'Одговорите не може да се испратат. Обидете се повторно.');
    } finally {
      setBusy(false);
    }
  };

  const who = meta?.companyName || 'работодавач';
  const label = TITLE[meta?.type] || 'Интервју';
  const isExit = meta?.type === 'exit';

  return (
    <PublicLayout>
      <SEOHelmet title={`${label} · Nexa`} description="Кратко интервју — одговорете со свои зборови." locale="mk_MK" noIndex />
      <section className={`nx-section ${s.wrap}`}>
        <div className="nexa-container">

          {phase === 'loading' && <p className={s.hint}>Се вчитува…</p>}

          {(phase === 'notfound' || phase === 'error') && (
            <div className={s.card}>
              <h1 className={s.title}>Линкот не е достапен</h1>
              <p className={s.lead}>Овој линк е неважечки или истечен. Побарајте нов линк од работодавачот што ве покани.</p>
            </div>
          )}

          {phase === 'completed' && (
            <div className={s.card}>
              <div className={s.thanksIcon}><Icon name="check" size={30} /></div>
              <h1 className={s.title}>Веќе одговоривте</h1>
              <p className={s.lead}>Ова интервју е веќе пополнето. Ви благодариме!</p>
            </div>
          )}

          {phase === 'done' && (
            <div className={s.card}>
              <div className={s.thanksIcon}><Icon name="check" size={30} /></div>
              <h1 className={s.title}>Ви благодариме!</h1>
              <p className={s.lead}>Вашите одговори се испратени до <strong>{who}</strong>. Пријатен ден!</p>
            </div>
          )}

          {phase === 'intro' && meta && (
            <div className={s.card}>
              <span className="nx-pill"><Icon name="shield" size={14} /> Доверливо · 5–10 минути</span>
              <h1 className={s.title}>{label}</h1>
              <p className={s.lead}>
                <strong>{who}</strong> ве замоли да одговорите на {questions.length} прашања
                {meta.subjectName ? `, ${meta.subjectName}` : ''}.{' '}
                {isExit
                  ? 'Вашите искрени одговори помагаат да се подобри работната средина.'
                  : 'Одговарајте искрено и со свои зборови — нема точни или погрешни одговори.'}
              </p>
              <button type="button" className="nexa-btn nexa-btn-accent nexa-btn-lg" onClick={() => setPhase('form')} disabled={!questions.length}>
                Започни <Icon name="arrowRight" size={18} />
              </button>
            </div>
          )}

          {phase === 'form' && (
            <div className={s.formCard}>
              <h1 className={s.title}>{label}</h1>
              <p className={s.leadSm}>Одговорете на прашањата подолу, потоа испратете.</p>

              {/* Honeypot — hidden from humans; bots fill it and get rejected. */}
              <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)}
                     tabIndex={-1} autoComplete="off" className={s.honeypot} aria-hidden="true" />

              <ol className={s.qList}>
                {questions.map((q, i) => (
                  <li key={q.id} className={s.qItem}>
                    <div className={s.qText}><span className={s.qNum}>{i + 1}.</span> {q.text}</div>
                    {q.kind === 'rating' ? (
                      <div className={s.ratingRow}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} type="button"
                            className={`${s.ratingBtn} ${Number(answers[q.id]) === n ? s.ratingActive : ''}`}
                            onClick={() => setAnswer(q.id, n)}>{n}</button>
                        ))}
                        <span className={s.ratingHint}>1 = најмалку · 5 = најмногу</span>
                      </div>
                    ) : (
                      <textarea className={s.answer} rows={3} maxLength={4000}
                        value={answers[q.id] || ''}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                        placeholder="Вашиот одговор…" />
                    )}
                  </li>
                ))}
              </ol>

              {error && <p className={s.error}>{error}</p>}
              {!enough && <p className={s.hintMuted}>Одговорете на повеќето прашања за да испратите.</p>}
              <button type="button" className="nexa-btn nexa-btn-accent nexa-btn-lg" onClick={submit} disabled={busy || !enough}>
                {busy ? 'Се испраќа…' : 'Испрати одговори'}
              </button>
            </div>
          )}

        </div>
      </section>
    </PublicLayout>
  );
}

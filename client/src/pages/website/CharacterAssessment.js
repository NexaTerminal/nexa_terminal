import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import Icon from '../../components/website/Icon';
import q from './Proverka.module.css';
import ca from './CharacterAssessment.module.css';

/**
 * „Проценка на карактер" — public respondent page (no login). A candidate/employee
 * opens their personal link, answers 25 bipolar Big Five questions, and submits.
 * They only ever see a thank-you — the profile report is owner-only. Scoring is
 * server-side (/api/public/character-assessment).
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

// 5-point bipolar scale. Value 1 = fully left … 5 = fully right. The end labels
// mirror the screenshot ("Најмногу лево / Неутрално / Најмногу десно").
const SCALE = [1, 2, 3, 4, 5];

export default function CharacterAssessment() {
  const { token } = useParams();
  const [phase, setPhase] = useState('loading'); // loading | intro | quiz | done | error | completed | notfound
  const [meta, setMeta] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [emailedToInvite, setEmailedToInvite] = useState(false);
  const [selfEmail, setSelfEmail] = useState('');
  const [selfState, setSelfState] = useState(null); // null | 'sending' | 'sent' | 'error'

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`${API_BASE}/public/character-assessment/${token}`).then((r) => r.json().then((d) => ({ ok: r.ok, d }))),
      fetch(`${API_BASE}/public/character-assessment/questions`).then((r) => r.json()),
    ])
      .then(([metaRes, qRes]) => {
        if (cancelled) return;
        if (!metaRes.ok || !metaRes.d?.success) { setPhase('notfound'); return; }
        if (metaRes.d.status === 'completed') { setPhase('completed'); return; }
        setMeta(metaRes.d.data);
        setQuestions(qRes.data || []);
        setPhase('intro');
      })
      .catch(() => { if (!cancelled) setPhase('error'); });
    return () => { cancelled = true; };
  }, [token]);

  const choose = (value) => {
    const cur = questions[step];
    const next = { ...answers, [cur.id]: value };
    setAnswers(next);
    // Small delay so the selection is visible before advancing.
    setTimeout(() => {
      if (step + 1 < questions.length) setStep(step + 1);
      else submit(next);
    }, 160);
  };

  const submit = async (finalAnswers) => {
    setBusy(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/public/character-assessment/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers }),
      });
      const data = await res.json();
      if (res.status === 409) { setPhase('completed'); return; }
      if (!res.ok || !data.success) throw new Error(data.message || 'Грешка');
      setEmailedToInvite(!!data.emailedToInvite);
      setPhase('done');
    } catch (ex) {
      setError(ex.message || 'Одговорите не може да се испратат. Обидете се повторно.');
    } finally {
      setBusy(false);
    }
  };

  const sendMeResults = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selfEmail.trim())) { setSelfState('error'); return; }
    setSelfState('sending');
    try {
      const res = await fetch(`${API_BASE}/public/character-assessment/${token}/email-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: selfEmail.trim() }),
      });
      const data = await res.json();
      setSelfState(res.ok && data.success ? 'sent' : 'error');
    } catch (_) {
      setSelfState('error');
    }
  };

  const cur = questions[step];
  const answered = Object.keys(answers).length;
  const progressPct = questions.length ? Math.round((answered / questions.length) * 100) : 0;
  const who = meta?.companyName || 'работодавач';

  return (
    <PublicLayout>
      <SEOHelmet
        title="Проценка на карактер · Nexa"
        description="Кратка проценка на личноста (модел „Големите пет“). 25 прашања, околу 5 минути."
        locale="mk_MK"
        noIndex
      />
      <section className={`nx-section ${q.wrap}`}>
        <div className="nexa-container">

          {phase === 'loading' && <p className={q.hint}>Се вчитува…</p>}

          {(phase === 'notfound' || phase === 'error') && (
            <div className={q.intro}>
              <h1 className={q.title}>Линкот не е достапен</h1>
              <p className={q.lead}>
                Овој линк за проценка е неважечки или истечен. Побарајте нов линк од
                работодавачот што ве покани.
              </p>
            </div>
          )}

          {phase === 'completed' && (
            <div className={ca.thanks}>
              <div className={ca.thanksIcon}><Icon name="check" size={30} /></div>
              <h1 className={q.title}>Веќе одговоривте</h1>
              <p className={q.lead}>Оваа проценка е веќе пополнета. Ви благодариме!</p>
            </div>
          )}

          {phase === 'intro' && meta && (
            <div className={q.intro}>
              <span className="nx-pill"><Icon name="shield" size={14} /> Доверливо · околу 5 минути</span>
              <h1 className={q.title}>Проценка на карактер</h1>
              <p className={q.lead}>
                <strong>{who}</strong> ве покани да пополните кратка проценка на личноста
                (модел „Големите пет“). Има <strong>25 кратки прашања</strong>. Нема точни
                или погрешни одговори — за секој пар изберете колку левата или десната
                изјава ве опишува.
              </p>
              <ul className={q.introList}>
                <li>Одговарајте искрено и спонтано — првиот впечаток е најдобар</li>
                <li>Средината значи „неутрално / подеднакво“</li>
                <li>Резултатот го добива само работодавачот што ве покани</li>
              </ul>
              <button type="button" className="nexa-btn nexa-btn-accent nexa-btn-lg" onClick={() => setPhase('quiz')} disabled={!questions.length}>
                {questions.length ? 'Започни' : 'Се вчитува…'}
                <Icon name="arrowRight" size={18} />
              </button>
              {error && <p className={q.error}>{error}</p>}
            </div>
          )}

          {phase === 'quiz' && cur && (
            <div className={q.quiz}>
              <div className={q.progressRow}>
                <span className={q.progressLabel}>Прашање {step + 1} / {questions.length}</span>
                <div className={q.progressTrack}><div className={q.progressFill} style={{ width: `${progressPct}%` }} /></div>
              </div>

              <div className={ca.scaleCard}>
                <div className={ca.scaleHeadRow}>
                  <span className={ca.scaleEnd}>Најмногу лево</span>
                  <span className={ca.scaleMid}>Неутрално</span>
                  <span className={ca.scaleEnd}>Најмногу десно</span>
                </div>
                <div className={ca.scaleRow} role="radiogroup" aria-label="Скала">
                  {SCALE.map((v) => {
                    const selected = answers[cur.id] === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        className={`${ca.scaleCell} ${ca[`lvl${v}`]} ${selected ? ca.scaleCellSel : ''}`}
                        onClick={() => choose(v)}
                        disabled={busy}
                        role="radio"
                        aria-checked={selected}
                        aria-label={`Ниво ${v}`}
                      >
                        <span className={ca.scaleDot} />
                      </button>
                    );
                  })}
                </div>
                <div className={ca.statementRow}>
                  <p className={ca.statementLeft}>{cur.left}</p>
                  <p className={ca.statementRight}>{cur.right}</p>
                </div>
              </div>

              {step > 0 && (
                <button type="button" className={q.backLink} onClick={() => setStep(step - 1)} disabled={busy}>← Претходно прашање</button>
              )}
              {busy && <p className={q.hint}>Се испраќа…</p>}
              {error && <p className={q.error}>{error}</p>}
            </div>
          )}

          {phase === 'done' && (
            <div className={ca.thanks}>
              <div className={ca.thanksIcon}><Icon name="check" size={30} /></div>
              <h1 className={q.title}>Ви благодариме!</h1>
              <p className={q.lead}>
                Вашите одговори се успешно испратени. Резултатот ќе го добие работодавачот
                што ве покани.
                {emailedToInvite && ' Копија од вашите резултати е испратена на вашата е-пошта.'}
              </p>

              {selfState === 'sent' ? (
                <p className={ca.selfOk}>✓ Резултатите се испратени на {selfEmail}.</p>
              ) : (
                <div className={ca.selfBox}>
                  <label className={ca.selfLabel}>
                    {emailedToInvite ? 'Сакате копија и на друга е-пошта?' : 'Сакате да ги добиете вашите резултати на е-пошта?'}
                  </label>
                  <div className={ca.selfRow}>
                    <input
                      className={ca.selfInput}
                      type="email"
                      placeholder="вашата@епошта.мк"
                      value={selfEmail}
                      onChange={(e) => { setSelfEmail(e.target.value); if (selfState === 'error') setSelfState(null); }}
                      maxLength={160}
                    />
                    <button type="button" className="nexa-btn nexa-btn-accent" onClick={sendMeResults} disabled={selfState === 'sending'}>
                      {selfState === 'sending' ? 'Се испраќа…' : 'Испрати ми'}
                    </button>
                  </div>
                  {selfState === 'error' && <p className={q.error}>Внесете валидна е-пошта и обидете се повторно.</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}

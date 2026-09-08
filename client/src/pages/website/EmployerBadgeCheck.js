import { useEffect, useState } from 'react';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import Icon from '../../components/website/Icon';
import q from './Proverka.module.css';
import s from './EmployerBadge.module.css';

/**
 * „Проверен работодавач" — public employer-compliance check (no login). The
 * acquisition funnel: ~18 employee-facing questions → rating (A/A+/A++) teaser →
 * sign up with Google to CLAIM the shareable badge. Evaluated server-side
 * (/api/public/employer-badge).
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
export const BADGE_RESULT_KEY = 'nexa_employer_badge_result_id';

const SEVERITY_LABEL = { high: 'Висок ризик', medium: 'Среден ризик', advisory: 'Препорака' };

export default function EmployerBadgeCheck() {
  const [phase, setPhase] = useState('intro'); // intro | quiz | results
  const [questions, setQuestions] = useState([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [companyName, setCompanyName] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/public/employer-badge/questions`)
      .then((r) => r.json())
      .then((d) => setQuestions(d.data || []))
      .catch(() => setError('Прашањата не може да се вчитаат. Обидете се повторно.'));
  }, []);

  const answer = (value) => {
    const cur = questions[step];
    const next = { ...answers, [cur.id]: value };
    setAnswers(next);
    if (step + 1 < questions.length) setStep(step + 1);
    else submit(next);
  };

  const submit = async (finalAnswers) => {
    setBusy(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/public/employer-badge/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers, companyName: companyName.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Грешка');
      setResult(data.data);
      try { localStorage.setItem(BADGE_RESULT_KEY, data.data.id); } catch (_) { /* private mode */ }
      setPhase('results');
    } catch (ex) {
      setError(ex.message || 'Резултатот не може да се пресмета. Обидете се повторно.');
    } finally {
      setBusy(false);
    }
  };

  // Google-first claim: carry the result id through OAuth to the claim page.
  const claimWithGoogle = () => {
    const redirect = `/terminal/badge-claim?result=${result.id}`;
    window.location.href = `${API_BASE}/auth/google?state=${encodeURIComponent(redirect)}`;
  };

  const cur = questions[step];
  const progressPct = questions.length ? Math.round((step / questions.length) * 100) : 0;

  return (
    <PublicLayout>
      <SEOHelmet
        title="Стани „Проверен работодавач“ · Nexa"
        description="Одговорете на ~18 прашања и добијте Nexa значка „Проверен работодавач“ што ја покажува вашата посветеност на работничките права — за да привлечете подобри вработени."
        canonical="/proverka-rabotodavac"
        locale="mk_MK"
      />
      <section className={`nx-section ${q.wrap}`}>
        <div className="nexa-container">

          {phase === 'intro' && (
            <div className={q.intro}>
              <span className="nx-pill"><Icon name="shield" size={14} /> Бесплатно · без најава · 3 минути</span>
              <h1 className={q.title}>Стани „Проверен работодавач“</h1>
              <p className={q.lead}>
                Покажете им на кандидатите дека кај вас работничките права се почитуваат.
                Одговорете на ~18 прашања за договори, плати, одмори, безбедност и фер
                однос — и добијте Nexa значка со рејтинг (A / A+ / A++) што можете да ја
                поставите на огласите за работа и на вашата страница.
              </p>
              <ul className={q.introList}>
                <li>Прашањата се засновани на македонскиот Закон за работните односи</li>
                <li>Значката е самопроценка — сигнал на посветеност, не правна заверка</li>
                <li>Значката ја добивате бесплатно по регистрација (важи 1 година)</li>
              </ul>
              <div className={s.companyField}>
                <input
                  className={s.companyInput}
                  type="text"
                  placeholder="Име на компанијата (за значката, опционално)"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  maxLength={160}
                />
              </div>
              <button type="button" className="nexa-btn nexa-btn-accent nexa-btn-lg" onClick={() => setPhase('quiz')} disabled={!questions.length}>
                {questions.length ? 'Започни ја проверката' : 'Се вчитува…'}
                <Icon name="arrowRight" size={18} />
              </button>
              {error && <p className={q.error}>{error}</p>}
            </div>
          )}

          {phase === 'quiz' && cur && (
            <div className={q.quiz}>
              <p className={s.honestNote}>Одговарајте искрено — примерите покажуваат чести замки. Значката вреди само ако е вистинита.</p>
              <div className={q.progressRow}>
                <span className={q.progressLabel}>Прашање {step + 1} / {questions.length}</span>
                <div className={q.progressTrack}><div className={q.progressFill} style={{ width: `${progressPct}%` }} /></div>
              </div>
              <div className={q.card}>
                <div className={q.article}>{cur.article}</div>
                <h2 className={q.question}>{cur.text}</h2>
                {cur.example && <p className={s.exampleHint}>{cur.example}</p>}
                <div className={q.answerRow}>
                  <button type="button" className={`${q.answerBtn} ${q.answerYes}`} onClick={() => answer('yes')} disabled={busy}>Да</button>
                  <button type="button" className={`${q.answerBtn} ${q.answerNo}`} onClick={() => answer('no')} disabled={busy}>Не</button>
                  <button type="button" className={q.answerNa} onClick={() => answer('na')} disabled={busy}>Не е применливо</button>
                </div>
              </div>
              {step > 0 && (
                <button type="button" className={q.backLink} onClick={() => setStep(step - 1)} disabled={busy}>← Претходно прашање</button>
              )}
              {busy && <p className={q.hint}>Се пресметува…</p>}
              {error && <p className={q.error}>{error}</p>}
            </div>
          )}

          {phase === 'results' && result && (
            <div className={q.results}>
              <div className={s.ratingHero}>
                {result.eligible ? (
                  <>
                    <div className={s.ratingLetter}>{result.ratingTier}</div>
                    <p className={s.ratingLabel}>{result.ratingLabel}</p>
                    <p className={s.ratingSub}>Резултат: {result.percentage}% · квалификувани сте за значка „Проверен работодавач“.</p>
                  </>
                ) : (
                  <>
                    <div className={s.ratingLetter}>{result.percentage}%</div>
                    <p className={s.ratingLabel}>Уште не квалификувате за значка</p>
                    <p className={s.notEligible}>
                      Потребни се најмалку 65%. Решете ги долунаведените недостатоци и повторете ја проверката.
                    </p>
                  </>
                )}
              </div>

              {result.topGaps.map((g) => (
                <div key={g.id} className={q.gapCard}>
                  <div className={q.gapHead}>
                    <span className={`${q.sevBadge} ${q[`sev_${g.severity}`]}`}>{SEVERITY_LABEL[g.severity] || g.severity}</span>
                    <span className={q.gapArticle}>{g.article}</span>
                  </div>
                  <h3 className={q.gapTitle}>{g.gapTitle}</h3>
                  <p className={q.gapRisk}>{g.risk}</p>
                  <div className={q.gapFix}><Icon name="check" size={15} /> {g.fix}</div>
                </div>
              ))}

              <div className={q.ctaBlock}>
                <h2 className={q.ctaTitle}>
                  {result.eligible ? 'Земете ја вашата значка' : 'Отворете го целосниот извештај'}
                </h2>
                <p className={q.ctaLead}>
                  {result.eligible
                    ? 'Регистрирајте се со Google за да ја преземете значката и потврдата — бесплатно, важи 1 година. Потоа ставете ја на огласите за работа и на вашата страница.'
                    : 'Регистрирајте се со Google за целосниот извештај и документите што ги решаваат недостатоците — потоа повторете ја проверката за да ја земете значката.'}
                </p>
                <button type="button" className="nexa-btn nexa-btn-accent nexa-btn-lg" onClick={claimWithGoogle}>
                  Продолжи со Google <Icon name="arrowRight" size={18} />
                </button>
              </div>

              <p className={q.disclaimer}>
                Оваа проверка е информативна самопроценка и не претставува правен совет или заверка.
                Резултатот се заснова исклучиво на вашите одговори.
              </p>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}

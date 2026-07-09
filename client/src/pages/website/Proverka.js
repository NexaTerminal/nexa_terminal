import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import Icon from '../../components/website/Icon';
import styles from './Proverka.module.css';

/**
 * „Бесплатна проверка" — public teaser compliance screening (no login).
 * The acquisition funnel: 10 questions → score + top gaps → email capture
 * → register CTA. Master-plan Phase 1.1.
 *
 * Answers are evaluated server-side (/api/public/screening) — this page
 * never sees the correct answers.
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
export const PROVERKA_RESULT_KEY = 'nexa_proverka_result_id';

const SEVERITY_LABEL = {
  high: 'Висок ризик',
  medium: 'Среден ризик',
  advisory: 'Препорака'
};

export default function Proverka() {
  const [phase, setPhase] = useState('intro'); // intro | quiz | results
  const [questions, setQuestions] = useState([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Email capture on the results screen.
  const [email, setEmail] = useState('');
  const [emailState, setEmailState] = useState(null); // { ok, msg }
  const [emailBusy, setEmailBusy] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/public/screening/questions`)
      .then((r) => r.json())
      .then((d) => setQuestions(d.data || []))
      .catch(() => setError('Прашањата не може да се вчитаат. Обидете се повторно.'));
  }, []);

  const answer = (value) => {
    const q = questions[step];
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    if (step + 1 < questions.length) {
      setStep(step + 1);
    } else {
      submit(next);
    }
  };

  const submit = async (finalAnswers) => {
    setBusy(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/public/screening/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Грешка');
      setResult(data.data);
      try { localStorage.setItem(PROVERKA_RESULT_KEY, data.data.id); } catch (_) { /* private mode */ }
      setPhase('results');
    } catch (ex) {
      setError(ex.message || 'Резултатот не може да се пресмета. Обидете се повторно.');
    } finally {
      setBusy(false);
    }
  };

  const captureEmail = async (e) => {
    e.preventDefault();
    if (!email.trim() || !result) return;
    setEmailBusy(true); setEmailState(null);
    try {
      const res = await fetch(`${API_BASE}/public/screening/result/${result.id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Грешка');
      setEmailState({ ok: true, msg: 'Извештајот е испратен на вашата е-пошта.' });
    } catch (ex) {
      setEmailState({ ok: false, msg: ex.message || 'Обидете се повторно.' });
    } finally {
      setEmailBusy(false);
    }
  };

  const q = questions[step];
  const progressPct = questions.length ? Math.round((step / questions.length) * 100) : 0;

  return (
    <PublicLayout>
      <SEOHelmet
        title="Бесплатна проверка на усогласеност · Nexa"
        description="Одговорете 10 прашања и дознајте колку вашата фирма е усогласена со работните односи, личните податоци и безбедноста при работа — бесплатно, за 3 минути."
        canonical="/proverka"
        locale="mk_MK"
      />

      <section className={`nx-section ${styles.wrap}`}>
        <div className="nexa-container">

          {phase === 'intro' && (
            <div className={styles.intro}>
              <span className="nx-pill">
                <Icon name="shield" size={14} />
                Бесплатно · без најава · 3 минути
              </span>
              <h1 className={styles.title}>Колку е усогласен вашиот бизнис?</h1>
              <p className={styles.lead}>
                10 прашања за работните односи, личните податоци и безбедноста при
                работа — областите што трудовата инспекција и АЗЛП најчесто ги
                проверуваат. Веднаш добивате резултат и листа што ви недостасува.
              </p>
              <ul className={styles.introList}>
                <li>Прашањата се засновани на конкретни членови од македонските закони</li>
                <li>Резултатот е анонимен — е-пошта е потребна само ако сакате извештај</li>
                <li>За секој недостаток гледате како Nexa го решава</li>
              </ul>
              <button
                type="button"
                className="nexa-btn nexa-btn-accent nexa-btn-lg"
                onClick={() => setPhase('quiz')}
                disabled={!questions.length}
              >
                {questions.length ? 'Започни ја проверката' : 'Се вчитува…'}
                <Icon name="arrowRight" size={18} />
              </button>
              {error && <p className={styles.error}>{error}</p>}
            </div>
          )}

          {phase === 'quiz' && q && (
            <div className={styles.quiz}>
              <div className={styles.progressRow}>
                <span className={styles.progressLabel}>Прашање {step + 1} / {questions.length}</span>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.article}>{q.article}</div>
                <h2 className={styles.question}>{q.text}</h2>
                <div className={styles.answerRow}>
                  <button type="button" className={`${styles.answerBtn} ${styles.answerYes}`} onClick={() => answer('yes')} disabled={busy}>Да</button>
                  <button type="button" className={`${styles.answerBtn} ${styles.answerNo}`} onClick={() => answer('no')} disabled={busy}>Не</button>
                  <button type="button" className={styles.answerNa} onClick={() => answer('na')} disabled={busy}>Не е применливо</button>
                </div>
              </div>

              {step > 0 && (
                <button type="button" className={styles.backLink} onClick={() => setStep(step - 1)} disabled={busy}>
                  ← Претходно прашање
                </button>
              )}
              {busy && <p className={styles.hint}>Се пресметува…</p>}
              {error && <p className={styles.error}>{error}</p>}
            </div>
          )}

          {phase === 'results' && result && (
            <div className={styles.results}>
              <div className={styles.scoreBlock}>
                <div className={`${styles.scoreRing} ${styles[`ring_${result.gradeClass}`]}`}>
                  <span className={styles.scoreNum}>{result.percentage}%</span>
                </div>
                <div>
                  <h1 className={styles.gradeTitle}>{result.grade}</h1>
                  <p className={styles.gradeSub}>
                    {result.gapCount === 0
                      ? 'Одлично — не идентификувавме недостатоци во опфатените области.'
                      : `Идентификувавме ${result.gapCount} ${result.gapCount === 1 ? 'недостаток' : 'недостатоци'}${result.gapCount > 3 ? ' — еве ги трите најважни' : ''}:`}
                  </p>
                </div>
              </div>

              {result.topGaps.map((g) => (
                <div key={g.id} className={styles.gapCard}>
                  <div className={styles.gapHead}>
                    <span className={`${styles.sevBadge} ${styles[`sev_${g.severity}`]}`}>
                      {SEVERITY_LABEL[g.severity] || g.severity}
                    </span>
                    <span className={styles.gapArticle}>{g.article}</span>
                  </div>
                  <h3 className={styles.gapTitle}>{g.gapTitle}</h3>
                  <p className={styles.gapRisk}>{g.risk}</p>
                  <div className={styles.gapFix}>
                    <Icon name="check" size={15} />
                    {g.fix}
                  </div>
                </div>
              ))}

              <div className={styles.ctaBlock}>
                <h2 className={styles.ctaTitle}>Решете ги недостатоците уште оваа недела</h2>
                <p className={styles.ctaLead}>
                  Nexa Терминал ги генерира документите што ви недостасуваат за 30
                  секунди и ве води низ целосни проверки — на македонски, според
                  македонското право. Регистрацијата е бесплатна.
                </p>
                <Link to="/login" className="nexa-btn nexa-btn-accent nexa-btn-lg">
                  Отворете сметка
                  <Icon name="arrowRight" size={18} />
                </Link>
              </div>

              <form className={styles.emailForm} onSubmit={captureEmail}>
                <label className={styles.emailLabel} htmlFor="proverka-email">
                  Испратете ми го целиот извештај на е-пошта:
                </label>
                <div className={styles.emailRow}>
                  <input
                    id="proverka-email"
                    type="email"
                    className={styles.emailInput}
                    placeholder="vasata@firma.mk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={emailBusy || emailState?.ok}
                  />
                  <button type="submit" className={styles.emailBtn} disabled={emailBusy || emailState?.ok || !email.trim()}>
                    {emailBusy ? 'Се испраќа…' : emailState?.ok ? 'Испратено ✓' : 'Испрати'}
                  </button>
                </div>
                {emailState && (
                  <p className={emailState.ok ? styles.emailOk : styles.error}>{emailState.msg}</p>
                )}
              </form>

              <p className={styles.disclaimer}>
                Оваа проверка е информативна и не претставува правен совет. Резултатот
                се заснова исклучиво на вашите одговори.
              </p>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}

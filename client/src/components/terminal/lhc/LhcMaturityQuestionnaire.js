import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCredit } from '../../../contexts/CreditContext';
import styles from '../../../styles/terminal/lhc/ComplianceCheck.module.css';
import Header from '../../common/Header';
import Sidebar from '../../terminal/Sidebar';
import InsufficientCreditsModal from '../../common/InsufficientCreditsModal';
import useCreditHandler from '../../../hooks/useCreditHandler';
import api from '../../../services/api';
import useLhcDraft from '../../../hooks/useLhcDraft';

/**
 * Reusable graduated (a/b/c/d) LHC questionnaire with profiling-first
 * applicability gating and autosave. Used by modules whose questions use the
 * maturity schema (e.g. Employment Part 1). Company size, when relevant, is a
 * profiling question flagged `companySize` and sent with the evaluation.
 */
const LhcMaturityQuestionnaire = ({ moduleKey, title, intro, questionsPath, evaluatePath, reportBase, creditLabel }) => {
  const navigate = useNavigate();
  const { refreshCredits } = useCredit();
  const { handleCreditOperation, showInsufficientModal, modalConfig, closeModal } = useCreditHandler();

  const { initialDraft, saveDraft, clearDraft, savedAt } = useLhcDraft(moduleKey);
  const [profiling, setProfiling] = useState([]);
  const [categories, setCategories] = useState([]);
  const [answers, setAnswers] = useState(initialDraft?.answers || {});
  const [currentStep, setCurrentStep] = useState(initialDraft?.currentStep || 0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const response = await api.get(questionsPath);
        if (response && response.success) {
          setProfiling(response.data.profiling || []);
          setCategories(response.data.categories || []);
        } else {
          setError('Невалиден одговор од серверот. Ве молиме обидете се повторно.');
        }
      } catch (err) {
        if (err.isPermissionError) {
          setError('Пополнете ги сите задолжителни податоци за компанијата (име, адреса, даночен број, менаџер и email) за да пристапите до оваа функција.');
        } else if (err.isAuthError) {
          setError('Не сте автентифицирани. Ве молиме најавете се повторно.');
        } else {
          setError('Грешка при преземање на прашањата. Ве молиме обидете се повторно.');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [questionsPath]);

  useEffect(() => {
    if (!loading) saveDraft({ answers, currentStep });
  }, [answers, currentStep, loading, saveDraft]);

  // applicability flags from profiling — mirrors server computeFlags:
  // boolean → true/false; single/multi → the raw answer value. (Previously only
  // booleans were handled, so single-value gates like turnoverBand never shaped
  // the visible questions on the client.)
  const flags = {};
  profiling.forEach(p => {
    if (!p.flag) return;
    const a = answers[p.id];
    if (a === undefined || a === null || a === '') return;
    flags[p.flag] = p.profilingType === 'boolean' ? (a === 'yes') : a;
  });
  // A question may carry a single {flag, appliesWhen} condition or an array of
  // conditions (ALL must pass — logical AND). An unanswered flag keeps the
  // question in scope.
  const isApplicable = (q) => {
    if (!q.applicability) return true;
    const conds = Array.isArray(q.applicability) ? q.applicability : [q.applicability];
    return conds.every(({ flag, appliesWhen }) => !(flag in flags) || flags[flag] === appliesWhen);
  };

  const companySizeQuestion = profiling.find(p => p.flag === 'companySize');
  const companySize = (companySizeQuestion && answers[companySizeQuestion.id]) || 'micro';

  const visibleCategories = categories
    .map(cat => ({ ...cat, questions: cat.questions.filter(isApplicable) }))
    .filter(cat => cat.questions.length > 0);

  const steps = [{ profiling: true, name: 'Профил на бизнисот' }, ...visibleCategories];
  const safeStep = Math.min(currentStep, steps.length - 1);
  const currentStepData = steps[safeStep];

  const handleAnswerChange = (questionId, value) => setAnswers(prev => ({ ...prev, [questionId]: value }));
  const handleMultiToggle = (questionId, optionKey) => {
    setAnswers(prev => {
      const cur = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const next = cur.includes(optionKey) ? cur.filter(k => k !== optionKey) : [...cur, optionKey];
      return { ...prev, [questionId]: next };
    });
  };

  const isAnswered = (q) => {
    const a = answers[q.id];
    if (q.profilingType === 'multi') return Array.isArray(a) && a.length > 0;
    return a !== undefined && a !== null && a !== '';
  };

  const allApplicable = [...profiling, ...visibleCategories.flatMap(c => c.questions)];
  const totalQuestions = allApplicable.length;
  const answeredCount = allApplicable.filter(isAnswered).length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const currentStepQuestions = currentStepData?.profiling ? profiling : (currentStepData?.questions || []);
  const currentStepComplete = currentStepQuestions.every(isAnswered);
  const isLastStep = safeStep === steps.length - 1;

  const handleNext = () => {
    if (!currentStepComplete) { setError('Ве молиме одговорете на сите прашања во овој чекор.'); return; }
    setError('');
    if (safeStep < steps.length - 1) setCurrentStep(safeStep + 1);
  };
  const handlePrevious = () => { setError(''); if (safeStep > 0) setCurrentStep(safeStep - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (answeredCount < totalQuestions) {
      setError(`Мора да одговорите на сите прашања. Преостануваат уште ${totalQuestions - answeredCount}.`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const response = await handleCreditOperation(
        async () => api.post(evaluatePath, { answers, companySize }),
        creditLabel,
        1
      );
      if (!response) { setSubmitting(false); return; }
      if (response && response.success) {
        await refreshCredits();
        clearDraft();
        navigate(`${reportBase}/${response.data._id}`);
      }
    } catch (err) {
      console.error('Error submitting assessment:', err);
      setError('Грешка при поднесување на проценката. Ве молиме обидете се повторно.');
      setSubmitting(false);
    }
  };

  const renderProfiling = (q, index) => (
    <div key={q.id} className={styles['question-card']}>
      <div className={styles['question-number']}>Прашање {index + 1}</div>
      <div className={styles['question-text']}>{q.text}</div>
      {q.helpText && <div className={styles['legal-reference']}>💡 {q.helpText}</div>}
      <div className={styles['answer-options']}>
        {q.profilingType === 'multi'
          ? q.options.map(o => (
              <label key={o.key} className={styles['answer-option']}>
                <input type="checkbox" checked={Array.isArray(answers[q.id]) && answers[q.id].includes(o.key)} onChange={() => handleMultiToggle(q.id, o.key)} />
                <span>{o.label}</span>
              </label>
            ))
          : q.options.map(o => (
              <label key={o.key} className={styles['answer-option']}>
                <input type="radio" name={q.id} value={o.key} checked={answers[q.id] === o.key} onChange={(e) => handleAnswerChange(q.id, e.target.value)} />
                <span>{o.label}</span>
              </label>
            ))}
      </div>
    </div>
  );

  const renderScored = (q, index) => (
    <div key={q.id} className={styles['question-card']}>
      <div className={styles['question-number']}>Прашање {index + 1}{q.critical ? ' · ⚠ Критично' : ''}</div>
      <div className={styles['question-text']}>{q.text}</div>
      {q.helpText && <div className={styles['legal-reference']}>💡 {q.helpText}</div>}
      <div className={styles['legal-reference']}>📋 {q.legalBasis || q.article}</div>
      <div className={styles['answer-options']}>
        {q.type === 'scale_1_10'
          ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <label key={n} className={styles['answer-option']}>
                <input type="radio" name={q.id} value={String(n)} checked={answers[q.id] === String(n)} onChange={(e) => handleAnswerChange(q.id, e.target.value)} />
                <span>{n}</span>
              </label>
            ))
          : (q.options || []).map(o => (
              <label key={o.key} className={styles['answer-option']}>
                <input type="radio" name={q.id} value={o.key} checked={answers[q.id] === o.key} onChange={(e) => handleAnswerChange(q.id, e.target.value)} />
                <span>{o.label}</span>
              </label>
            ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles['dashboard-layout']}>
          <Sidebar />
          <main className={styles['dashboard-main']}>
            <div className={styles['loading']}><p>Се вчитува прашалникот...</p></div>
          </main>
        </div>
      </div>
    );
  }

  if (error && categories.length === 0 && profiling.length === 0) {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles['dashboard-layout']}>
          <Sidebar />
          <main className={styles['dashboard-main']}>
            <div className={styles['questionnaire-container']}>
              <div className={styles['questionnaire-header']}><h1>{title}</h1></div>
              <div className={styles['error-message']}>{error}</div>
              <div className={styles['navigation-buttons']}>
                <button type="button" onClick={() => window.location.reload()} className={styles['btn-primary']}>Обиди се повторно</button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header isTerminal={true} />
      <div className={styles['dashboard-layout']}>
        <Sidebar />
        <main className={styles['dashboard-main']}>
          <div className={styles['questionnaire-container']}>
            <div className={styles['questionnaire-header']}>
              <h1>{title}</h1>
              <p>{intro}</p>
            </div>

            <div className={styles['progress-section']}>
              <div className={styles['progress-info']}>
                <span>Прогрес на пополнување</span>
                {savedAt && <span className={styles['autosave-indicator']}>💾 Зачувано</span>}
                <span>{Math.round(progress)}%</span>
              </div>
              <div className={styles['progress-bar']}>
                <div className={styles['progress-bar-fill']} style={{ width: `${progress}%` }}></div>
              </div>
              <div className={styles['category-navigation']}>
                <span>Чекор {safeStep + 1} од {steps.length}: {currentStepData?.name}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles['questions-section']}>
                <h2 className={styles['category-title']}>{currentStepData?.name}</h2>
                {currentStepData?.profiling && (
                  <p className={styles['findings-intro']}>
                    Овие прашања ги прилагодуваат прашањата на вашиот бизнис. Областите што не се однесуваат на вас нема да влијаат на резултатот.
                  </p>
                )}
                {currentStepData?.profiling
                  ? profiling.map((q, i) => renderProfiling(q, i))
                  : currentStepData?.questions.map((q, i) => renderScored(q, i))}
              </div>

              {error && <div className={styles['error-message']}>{error}</div>}

              <div className={styles['navigation-buttons']}>
                <button type="button" onClick={handlePrevious} disabled={safeStep === 0} className={styles['btn-secondary']}>← Претходно</button>
                {!isLastStep ? (
                  <button type="button" onClick={handleNext} className={styles['btn-primary']}>Следно →</button>
                ) : (
                  <button type="submit" disabled={submitting || answeredCount < totalQuestions} className={styles['btn-submit']}>
                    {submitting ? 'Се обработува...' : answeredCount < totalQuestions ? `Одговорете на сите прашања (${answeredCount}/${totalQuestions})` : 'Поднеси проценка'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </main>
      </div>
      <InsufficientCreditsModal
        isOpen={showInsufficientModal}
        onClose={closeModal}
        requiredCredits={modalConfig.requiredCredits}
        actionName={modalConfig.actionName}
      />
    </div>
  );
};

export default LhcMaturityQuestionnaire;

import React, { useState, useMemo } from 'react';
import styles from '../../styles/terminal/ContractAnalysis.module.css';

export default function IntroQuestions({ preScan, onSubmit, isAnalyzing }) {
  const questions = preScan?.questions || [];
  const parties = preScan?.parties || [];

  // If pre-scan didn't include "user-role", we still need it
  const needsRoleFallback = !questions.some(q => q.id === 'user-role');
  const roleFallbackOptions = useMemo(
    () => parties.map(p => `${p.role} (${p.label})`),
    [parties]
  );

  const [answers, setAnswers] = useState({});
  const [roleFallback, setRoleFallback] = useState(roleFallbackOptions[0] || '');

  const handleChange = (id, value) => setAnswers(prev => ({ ...prev, [id]: value }));

  // Toggle one option in a multi-choice answer (stored as an array).
  const toggleMulti = (id, opt) => setAnswers(prev => {
    const cur = Array.isArray(prev[id]) ? prev[id] : [];
    const next = cur.includes(opt) ? cur.filter(o => o !== opt) : [...cur, opt];
    return { ...prev, [id]: next };
  });

  const handleSubmit = () => {
    let userRole = answers['user-role'] || roleFallback;
    if (!userRole) {
      alert('Изберете ја вашата улога во договорот.');
      return;
    }
    const otherAnswers = { ...answers };
    delete otherAnswers['user-role'];
    onSubmit({ userRole, userAnswers: otherAnswers });
  };

  return (
    <div className={styles.questionsCard}>
      <h2 className={styles.cardTitle}>Неколку прашања пред анализата</h2>
      <p className={styles.cardSubtitle}>
        Тип на договор: <strong>{preScan?.contractType || 'непознато'}</strong>
        {preScan?.wordCount ? <> · {preScan.wordCount.toLocaleString('mk-MK')} зборови</> : null}
      </p>

      {questions.map(q => (
        <div key={q.id} className={styles.questionRow}>
          <label className={styles.questionLabel}>{q.question}</label>
          {q.type === 'single-choice' ? (
            <select
              className={styles.select}
              value={answers[q.id] || ''}
              onChange={(e) => handleChange(q.id, e.target.value)}
            >
              <option value="">— изберете —</option>
              {(q.options || []).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : q.type === 'multi-choice' ? (
            <div className={styles.chips}>
              {(q.options || []).map(opt => {
                const selected = Array.isArray(answers[q.id]) && answers[q.id].includes(opt);
                return (
                  <button
                    type="button"
                    key={opt}
                    className={`${styles.chip} ${selected ? styles.chipSelected : ''}`}
                    aria-pressed={selected}
                    onClick={() => toggleMulti(q.id, opt)}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <textarea
              className={styles.textarea}
              rows={3}
              value={answers[q.id] || ''}
              onChange={(e) => handleChange(q.id, e.target.value)}
              placeholder="Вашиот одговор (опционално)"
            />
          )}
        </div>
      ))}

      {needsRoleFallback && (
        <div className={styles.questionRow}>
          <label className={styles.questionLabel}>Која страна сте Вие во овој договор?</label>
          <select
            className={styles.select}
            value={roleFallback}
            onChange={(e) => setRoleFallback(e.target.value)}
          >
            {roleFallbackOptions.length === 0 && <option value="">— нема препознаени страни —</option>}
            {roleFallbackOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}

      <button
        className={styles.primaryButton}
        onClick={handleSubmit}
        disabled={isAnalyzing}
      >
        {isAnalyzing ? 'Анализирам…' : 'Анализирај го договорот'}
      </button>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCredit } from '../../../contexts/CreditContext';
import styles from '../../../styles/terminal/lhc/ComplianceCheck.module.css';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/terminal/Sidebar';
import InsufficientCreditsModal from '../../../components/common/InsufficientCreditsModal';
import useCreditHandler from '../../../hooks/useCreditHandler';
import api from '../../../services/api';

const GeneralQuestionnaire = () => {
  const navigate = useNavigate();
  const { refreshCredits } = useCredit();
  const { handleCreditOperation, showInsufficientModal, modalConfig, closeModal } = useCreditHandler();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [companySize, setCompanySize] = useState('micro');
  const [poolStats, setPoolStats] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await api.get('/lhc/general/questions');

      if (response && response.success) {
        setQuestions(response.data.questions);
        setPoolStats({
          total: response.data.totalPool,
          breakdown: response.data.poolBreakdown
        });
        setLoading(false);
      } else {
        setError('Невалиден одговор од серверот. Ве молиме обидете се повторно.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      if (err.isAuthError) {
        setError('Не сте автентифицирани. Ве молиме најавете се повторно.');
      } else if (err.isPermissionError) {
        setError('Пополнете ги сите задолжителни податоци за компанијата за да пристапите до оваа функција.');
      } else {
        setError('Грешка при преземање на прашањата. Ве молиме обидете се повторно.');
      }
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleMultiCheckChange = (questionId, optionId, checked) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        [optionId]: checked
      }
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const answeredCount = Object.keys(answers).length;
    if (answeredCount === 0) {
      setError('Мора да одговорите на барем едно прашање.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const questionIds = questions.map(q => q.id);

      const response = await handleCreditOperation(
        async () => api.post('/lhc/general/evaluate', {
          answers: answers,
          companySize: companySize,
          questionIds: questionIds
        }),
        'општ правен здравствен преглед',
        1
      );

      if (!response) {
        setSubmitting(false);
        return;
      }

      if (response && response.success) {
        await refreshCredits();
        navigate(`/terminal/legal-screening/general/report/${response.data._id}`);
      }
    } catch (err) {
      console.error('Error submitting assessment:', err);
      setError('Грешка при поднесување на проценката. Ве молиме обидете се повторно.');
      setSubmitting(false);
    }
  };

  const calculateProgress = () => {
    const answeredQuestions = Object.keys(answers).length;
    return questions.length > 0 ? (answeredQuestions / questions.length) * 100 : 0;
  };

  const renderAnswerOptions = (question) => {
    // Handle multi_check questions
    if (question.type === 'multi_check' && question.options) {
      return (
        <div className={styles["multi-check-options"]}>
          {question.options.map(option => (
            <label key={option.id} className={styles["multi-check-option"]}>
              <input
                type="checkbox"
                checked={answers[question.id]?.[option.id] || false}
                onChange={(e) => handleMultiCheckChange(question.id, option.id, e.target.checked)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      );
    }

    // Handle choice questions with custom options
    if (question.type === 'choice' && question.options) {
      return question.options.map(option => (
        <label key={option.value} className={styles["answer-option"]}>
          <input
            type="radio"
            name={question.id}
            value={option.value}
            checked={answers[question.id] === option.value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          />
          <span>{option.text || option.label}</span>
        </label>
      ));
    }

    // Handle yes_no_na and yes_partial_no with custom options from question
    if ((question.type === 'yes_no_na' || question.type === 'yes_partial_no') && question.options) {
      return question.options.map(option => (
        <label key={option.value} className={styles["answer-option"]}>
          <input
            type="radio"
            name={question.id}
            value={option.value}
            checked={answers[question.id] === option.value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          />
          <span>{option.label}</span>
        </label>
      ));
    }

    // Handle true_false questions
    if (question.type === 'true_false') {
      const options = question.options || [
        { value: 'true', label: 'Точно' },
        { value: 'partial', label: 'Делумно' },
        { value: 'false', label: 'Не е точно' }
      ];
      return options.map(option => (
        <label key={option.value} className={styles["answer-option"]}>
          <input
            type="radio"
            name={question.id}
            value={option.value}
            checked={answers[question.id] === option.value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          />
          <span>{option.label}</span>
        </label>
      ));
    }

    // Default yes/no/partially/not_applicable options
    return (
      <>
        <label className={styles["answer-option"]}>
          <input
            type="radio"
            name={question.id}
            value="yes"
            checked={answers[question.id] === 'yes'}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          />
          <span>Да</span>
        </label>
        <label className={styles["answer-option"]}>
          <input
            type="radio"
            name={question.id}
            value="no"
            checked={answers[question.id] === 'no'}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          />
          <span>Не</span>
        </label>
        <label className={styles["answer-option"]}>
          <input
            type="radio"
            name={question.id}
            value="partially"
            checked={answers[question.id] === 'partially'}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          />
          <span>Делумно</span>
        </label>
        <label className={styles["answer-option"]}>
          <input
            type="radio"
            name={question.id}
            value="not_applicable"
            checked={answers[question.id] === 'not_applicable'}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          />
          <span>Не е применливо</span>
        </label>
      </>
    );
  };

  if (loading) {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles["dashboard-layout"]}>
          <Sidebar />
          <main className={styles["dashboard-main"]}>
            <div className={styles["loading"]}>
              <p>Се подготвуваат случајни прашања...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles["dashboard-layout"]}>
          <Sidebar />
          <main className={styles["dashboard-main"]}>
            <div className={styles["questionnaire-container"]}>
              <div className={styles["questionnaire-header"]}>
                <h1>Брз правен здравствен преглед</h1>
                <p>20 случајно избрани прашања од сите области</p>
              </div>
              <div className={styles["error-message"]}>
                {error}
              </div>
              <div className={styles["navigation-buttons"]}>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className={styles["btn-primary"]}
                >
                  Обиди се повторно
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = calculateProgress();

  return (
    <div>
      <Header isTerminal={true} />

      <div className={styles["dashboard-layout"]}>
        <Sidebar />

        <main className={styles["dashboard-main"]}>
          <div className={styles["questionnaire-container"]}>
            {/* Header */}
            <div className={styles["questionnaire-header"]}>
              <h1>Брз правен здравствен преглед</h1>
              <p>
                20 случајно избрани прашања од сите области за брза проверка на усогласеноста.
                {poolStats && (
                  <span className={styles["pool-info"]}>
                    {' '}(од вкупно {poolStats.total} прашања)
                  </span>
                )}
              </p>
            </div>

            {/* Company Size Selection - Show on first question */}
            {currentQuestionIndex === 0 && (
              <div className={styles["company-size-section"]}>
                <label className={styles["company-size-label"]}>
                  Изберете ја големината на вашата компанија:
                </label>
                <select
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className={styles["company-size-select"]}
                >
                  <option value="micro">Микро претпријатие (1-9 вработени)</option>
                  <option value="small">Мало претпријатие (10-49 вработени)</option>
                  <option value="medium">Средно претпријатие (50-249 вработени)</option>
                  <option value="large">Големо претпријатие (250+ вработени)</option>
                </select>
              </div>
            )}

            {/* Progress Bar */}
            <div className={styles["progress-section"]}>
              <div className={styles["progress-info"]}>
                <span>Прогрес на пополнување</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className={styles["progress-bar"]}>
                <div
                  className={styles["progress-bar-fill"]}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className={styles["category-navigation"]}>
                <span>
                  Прашање {currentQuestionIndex + 1} од {questions.length}
                </span>
              </div>
            </div>

            {/* Current Question */}
            <form onSubmit={handleSubmit}>
              <div className={styles["questions-section"]}>
                <div className={styles["question-card"]}>
                  {/* Category Badge */}
                  <div
                    className={styles["source-category-badge"]}
                    style={{ backgroundColor: currentQuestion.sourceCategoryColor }}
                  >
                    <span className={styles["category-icon"]}>{currentQuestion.sourceCategoryIcon}</span>
                    <span>{currentQuestion.sourceCategoryName}</span>
                  </div>

                  <div className={styles["question-number"]}>
                    Прашање {currentQuestionIndex + 1}
                  </div>
                  <div className={styles["question-text"]}>
                    {currentQuestion.text}
                  </div>
                  <div className={styles["legal-reference"]}>
                    {currentQuestion.article}
                  </div>

                  <div className={styles["answer-options"]}>
                    {renderAnswerOptions(currentQuestion)}
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className={styles["error-message"]}>
                  {error}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className={styles["navigation-buttons"]}>
                <button
                  type="button"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={styles["btn-secondary"]}
                >
                  ← Претходно прашање
                </button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className={styles["btn-primary"]}
                  >
                    Следно прашање →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className={styles["btn-submit"]}
                  >
                    {submitting ? 'Се обработува...' : 'Поднеси проценка'}
                  </button>
                )}
              </div>

              {/* Quick Navigation - Question dots */}
              <div className={styles["question-dots"]}>
                {questions.map((q, index) => (
                  <button
                    key={q.id}
                    type="button"
                    className={`${styles["question-dot"]} ${
                      index === currentQuestionIndex ? styles["question-dot-active"] : ''
                    } ${answers[q.id] ? styles["question-dot-answered"] : ''}`}
                    onClick={() => setCurrentQuestionIndex(index)}
                    title={`Прашање ${index + 1}${answers[q.id] ? ' (одговорено)' : ''}`}
                    style={{
                      borderColor: q.sourceCategoryColor,
                      backgroundColor: answers[q.id] ? q.sourceCategoryColor : 'transparent'
                    }}
                  />
                ))}
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* Insufficient Credits Modal */}
      <InsufficientCreditsModal
        isOpen={showInsufficientModal}
        onClose={closeModal}
        requiredCredits={modalConfig.requiredCredits}
        actionName={modalConfig.actionName}
      />
    </div>
  );
};

export default GeneralQuestionnaire;

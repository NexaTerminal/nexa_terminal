import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCredit } from '../../../contexts/CreditContext';
import styles from '../../../styles/terminal/lhc/ComplianceCheck.module.css';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/terminal/Sidebar';
import InsufficientCreditsModal from '../../../components/common/InsufficientCreditsModal';
import useCreditHandler from '../../../hooks/useCreditHandler';
import api from '../../../services/api';

const EmploymentPart3Questionnaire = () => {
  const navigate = useNavigate();
  const { refreshCredits } = useCredit();
  const { handleCreditOperation, showInsufficientModal, modalConfig, closeModal } = useCreditHandler();

  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [companySize, setCompanySize] = useState('micro');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await api.get('/lhc/employment-part3/questions');

      if (response && response.success) {
        setCategories(response.data.categories);
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

  const handleNextCategory = () => {
    if (currentCategoryIndex < categories.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
    }
  };

  const handlePreviousCategory = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const answeredCount = Object.keys(answers).length;
    let totalQuestions = 0;
    categories.forEach(cat => totalQuestions += cat.questions.length);
    if (answeredCount < totalQuestions) {
      setError(`Мора да одговорите на сите прашања. Преостануваат уште ${totalQuestions - answeredCount}.`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await handleCreditOperation(
        async () => api.post('/lhc/employment-part3/evaluate', {
          answers: answers,
          companySize: companySize
        }),
        'правен здравствен преглед - работно време и одмор',
        1
      );

      if (!response) {
        setSubmitting(false);
        return;
      }

      if (response && response.success) {
        await refreshCredits();
        navigate(`/terminal/legal-screening/employment-part3/report/${response.data._id}`);
      }
    } catch (err) {
      console.error('Error submitting assessment:', err);
      setError('Грешка при поднесување на проценката. Ве молиме обидете се повторно.');
      setSubmitting(false);
    }
  };

  const calculateProgress = () => {
    let totalQuestions = 0;
    categories.forEach(cat => {
      totalQuestions += cat.questions.length;
    });
    const answeredQuestions = Object.keys(answers).length;
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  if (loading) {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles["dashboard-layout"]}>
          <Sidebar />
          <main className={styles["dashboard-main"]}>
            <div className={styles["loading"]}>
              <p>Се вчитува прашалникот...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error && categories.length === 0) {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles["dashboard-layout"]}>
          <Sidebar />
          <main className={styles["dashboard-main"]}>
            <div className={styles["questionnaire-container"]}>
              <div className={styles["questionnaire-header"]}>
                <h1>Работни односи: Дел 3 - Работно време и одмор</h1>
                <p>Одговорете на прашањата за да добиете детална проценка на усогласеноста.</p>
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

  const currentCategory = categories[currentCategoryIndex];
  const progress = calculateProgress();

  return (
    <div>
      <Header isTerminal={true} />

      <div className={styles["dashboard-layout"]}>
        <Sidebar />

        <main className={styles["dashboard-main"]}>
          <div className={styles["questionnaire-container"]}>
            <div className={styles["questionnaire-header"]}>
              <h1>Работни односи: Дел 3 - Работно време и одмор</h1>
              <p>Овој дел опфаќа прашања за работното време, прекувремена работа, ноќна работа и одмори.</p>
            </div>

            {currentCategoryIndex === 0 && (
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
                  Категорија {currentCategoryIndex + 1} од {categories.length}: {currentCategory.name}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles["questions-section"]}>
                <h2 className={styles["category-title"]}>{currentCategory.name}</h2>

                {currentCategory.questions.map((question, index) => (
                  <div key={question.id} className={styles["question-card"]}>
                    <div className={styles["question-number"]}>
                      Прашање {index + 1}
                    </div>
                    <div className={styles["question-text"]}>
                      {question.text}
                    </div>
                    <div className={styles["legal-reference"]}>
                      📋 {question.article}
                    </div>

                    <div className={styles["answer-options"]}>
                      {question.type === 'choice' && question.options ? (
                        question.options.map(option => (
                          <label key={option.value} className={styles["answer-option"]}>
                            <input
                              type="radio"
                              name={question.id}
                              value={option.value}
                              checked={answers[question.id] === option.value}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            />
                            <span>{option.text}</span>
                          </label>
                        ))
                      ) : (
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
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className={styles["error-message"]}>
                  {error}
                </div>
              )}

              <div className={styles["navigation-buttons"]}>
                <button
                  type="button"
                  onClick={handlePreviousCategory}
                  disabled={currentCategoryIndex === 0}
                  className={styles["btn-secondary"]}
                >
                  ← Претходна категорија
                </button>

                {currentCategoryIndex < categories.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextCategory}
                    className={styles["btn-primary"]}
                  >
                    Следна категорија →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting || Object.keys(answers).length < categories.reduce((sum, cat) => sum + cat.questions.length, 0)}
                    className={styles["btn-submit"]}
                  >
                    {submitting ? 'Се обработува...' : (() => {
                      const total = categories.reduce((sum, cat) => sum + cat.questions.length, 0);
                      const answered = Object.keys(answers).length;
                      return answered < total ? `Одговорете на сите прашања (${answered}/${total})` : 'Поднеси проценка';
                    })()}
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

export default EmploymentPart3Questionnaire;

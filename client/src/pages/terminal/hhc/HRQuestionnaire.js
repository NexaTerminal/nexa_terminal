import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCredit } from '../../../contexts/CreditContext';
import styles from '../../../styles/terminal/lhc/ComplianceCheck.module.css';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/terminal/Sidebar';
import InsufficientCreditsModal from '../../../components/common/InsufficientCreditsModal';
import useCreditHandler from '../../../hooks/useCreditHandler';
import api from '../../../services/api';

const HRQuestionnaire = () => {
  const navigate = useNavigate();
  const { refreshCredits } = useCredit();
  const { handleCreditOperation, showInsufficientModal, modalConfig, closeModal } = useCreditHandler();

  const [categories, setCategories] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await api.get('/hhc/hr/questions');

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
      window.scrollTo(0, 0);
    }
  };

  const handlePreviousCategory = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1);
      window.scrollTo(0, 0);
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
      const response = await handleCreditOperation(
        async () => api.post('/hhc/hr/evaluate', { answers }),
        'HR и оперативен здравствен преглед',
        1
      );

      if (!response) {
        setSubmitting(false);
        return;
      }

      if (response && response.success) {
        await refreshCredits();
        navigate(`/terminal/hr-screening/report/${response.data._id}`);
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
                <h1>HR и Оперативен Health Check</h1>
                <p>Проценете ја оперативната зрелост и HR практиките на вашата компанија.</p>
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
            {/* Header */}
            <div className={styles["questionnaire-header"]}>
              <h1>HR и Оперативен Health Check</h1>
              <p>Одговорете на 20 прашања за да добиете детална проценка на оперативната зрелост и HR практиките на вашата компанија.</p>
            </div>

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
                  Категорија {currentCategoryIndex + 1} од {categories.length}: {currentCategory.name}
                </span>
              </div>
            </div>

            {/* Questions */}
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

                    <div className={styles["answer-options"]}>
                      {question.options.map(option => (
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
                      ))}
                    </div>
                  </div>
                ))}
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
                  onClick={handlePreviousCategory}
                  disabled={currentCategoryIndex === 0}
                  className={styles["btn-secondary"]}
                >
                  Претходна категорија
                </button>

                {currentCategoryIndex < categories.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextCategory}
                    className={styles["btn-primary"]}
                  >
                    Следна категорија
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

export default HRQuestionnaire;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/terminal/lhc/ComplianceCheck.module.css';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/terminal/Sidebar';
import api from '../../../services/api';

const PAGE_TITLE = 'Проверка на усогласеност — Архивско и канцелариско работење';
const PAGE_INTRO = 'Одговорете на прашањата за да добиете проценка на усогласеноста на Вашата компанија со Законот за архивски материјал и архивска дејност (Сл. весник 135/2025) и Упатството за канцелариско и архивско работење (Сл. весник 99/2014). Законот започнува да се применува од 1 јуни 2026.';

const ArchivesQuestionnaire = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchQuestions(); }, []);

  const fetchQuestions = async () => {
    try {
      const response = await api.get('/lhc/archives/questions');
      if (response && response.success) {
        setCategories(response.data.categories);
      } else {
        setError('Невалиден одговор од серверот. Ве молиме обидете се повторно.');
      }
    } catch (err) {
      if (err.isAuthError) {
        setError('Не сте автентифицирани. Ве молиме најавете се повторно.');
      } else if (err.isPermissionError) {
        setError('Пополнете ги сите задолжителни податоци за компанијата (име, адреса, даночен број, менаџер и email) за да пристапите до оваа функција.');
      } else {
        setError('Грешка при преземање на прашањата. Ве молиме обидете се повторно.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNextCategory = () => {
    if (currentCategoryIndex < categories.length - 1) setCurrentCategoryIndex(prev => prev + 1);
  };
  const handlePreviousCategory = () => {
    if (currentCategoryIndex > 0) setCurrentCategoryIndex(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = categories.reduce((sum, cat) => sum + cat.questions.length, 0);
    if (answeredCount < totalQuestions) {
      setError(`Мора да одговорите на сите прашања. Преостануваат уште ${totalQuestions - answeredCount}.`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const response = await api.post('/lhc/archives/evaluate', { answers });
      if (response && response.success) {
        navigate(`/terminal/legal-screening/archives/report/${response.data._id}`);
      }
    } catch (err) {
      setError('Грешка при поднесување на проценката. Ве молиме обидете се повторно.');
      setSubmitting(false);
    }
  };

  const calculateProgress = () => {
    const totalQuestions = categories.reduce((sum, cat) => sum + cat.questions.length, 0);
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
            <div className={styles["loading"]}><p>Се вчитува прашалникот...</p></div>
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
                <h1>{PAGE_TITLE}</h1>
                <p>{PAGE_INTRO}</p>
              </div>
              <div className={styles["error-message"]}>{error}</div>
              <div className={styles["navigation-buttons"]}>
                <button type="button" onClick={() => window.location.reload()} className={styles["btn-primary"]}>
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
              <h1>{PAGE_TITLE}</h1>
              <p>{PAGE_INTRO}</p>
            </div>

            <div className={styles["progress-section"]}>
              <div className={styles["progress-info"]}>
                <span>Прогрес на пополнување</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className={styles["progress-bar"]}>
                <div className={styles["progress-bar-fill"]} style={{ width: `${progress}%` }} />
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
                    <div className={styles["question-number"]}>Прашање {index + 1}</div>
                    <div className={styles["question-text"]}>{question.text}</div>
                    <div className={styles["legal-reference"]}>📋 {question.article}</div>

                    <div className={styles["answer-options"]}>
                      {(question.type === 'yes_partial_no' || question.type === 'yes_no_na' || question.type === 'yes_no') && question.options ? (
                        // Render the custom options provided by the controller
                        question.options.map(option => (
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
                        ))
                      ) : question.type === 'choice' && question.options ? (
                        question.options.map(option => (
                          <label key={option.value} className={styles["answer-option"]}>
                            <input
                              type="radio"
                              name={question.id}
                              value={option.value}
                              checked={answers[question.id] === option.value}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            />
                            <span>{option.label || option.text}</span>
                          </label>
                        ))
                      ) : (
                        <>
                          <label className={styles["answer-option"]}>
                            <input type="radio" name={question.id} value="yes"
                              checked={answers[question.id] === 'yes'}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)} />
                            <span>Да</span>
                          </label>
                          <label className={styles["answer-option"]}>
                            <input type="radio" name={question.id} value="no"
                              checked={answers[question.id] === 'no'}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)} />
                            <span>Не</span>
                          </label>
                          <label className={styles["answer-option"]}>
                            <input type="radio" name={question.id} value="partial"
                              checked={answers[question.id] === 'partial'}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)} />
                            <span>Делумно</span>
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {error && <div className={styles["error-message"]}>{error}</div>}

              <div className={styles["navigation-buttons"]}>
                <button type="button" onClick={handlePreviousCategory} disabled={currentCategoryIndex === 0}
                        className={styles["btn-secondary"]}>
                  ← Претходна категорија
                </button>

                {currentCategoryIndex < categories.length - 1 ? (
                  <button type="button" onClick={handleNextCategory} className={styles["btn-primary"]}>
                    Следна категорија →
                  </button>
                ) : (
                  <button type="submit"
                          disabled={submitting || Object.keys(answers).length < categories.reduce((sum, cat) => sum + cat.questions.length, 0)}
                          className={styles["btn-submit"]}>
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
    </div>
  );
};

export default ArchivesQuestionnaire;

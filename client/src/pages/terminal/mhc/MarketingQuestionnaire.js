import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCredit } from '../../../contexts/CreditContext';
import styles from '../../../styles/terminal/lhc/ComplianceCheck.module.css';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/terminal/Sidebar';
import InsufficientCreditsModal from '../../../components/common/InsufficientCreditsModal';
import useCreditHandler from '../../../hooks/useCreditHandler';
import api from '../../../services/api';

const MarketingQuestionnaire = () => {
  const navigate = useNavigate();
  const { refreshCredits } = useCredit();
  const { handleCreditOperation, showInsufficientModal, modalConfig, closeModal } = useCreditHandler();

  // State
  const [step, setStep] = useState('industry'); // 'industry' | 'questionnaire'
  const [industries, setIndustries] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [categories, setCategories] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch industries on mount
  useEffect(() => {
    fetchIndustries();
  }, []);

  const fetchIndustries = async () => {
    try {
      const response = await api.get('/mhc/industries');
      if (response && response.success) {
        setIndustries(response.data);
      } else {
        // Fallback industries if API fails
        setIndustries([
          { id: 'services', name: 'Услуги', description: 'Консултантски услуги, агенции, професионални услуги' },
          { id: 'manufacturing', name: 'Производство / Фабрика', description: 'Производствени компании, private label, фабрики' },
          { id: 'retail', name: 'Трговија на мало / големо', description: 'Продавници, дистрибуција, малопродажба' },
          { id: 'hospitality', name: 'Угостителство / Туризам', description: 'Ресторани, хотели, туристички агенции' },
          { id: 'construction', name: 'Градежништво / Инженеринг', description: 'Градежни компании, архитекти, инженери' },
          { id: 'startup', name: 'Стартап / SaaS', description: 'Технолошки стартапи, софтверски компании' },
          { id: 'other', name: 'Друго', description: 'Останати индустрии' }
        ]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching industries:', err);
      if (err.isAuthError) {
        setError('Не сте автентифицирани. Ве молиме најавете се повторно.');
      } else if (err.isPermissionError) {
        setError('Пополнете ги сите задолжителни податоци за компанијата за да пристапите до оваа функција.');
      } else {
        // Fallback industries if API fails
        setIndustries([
          { id: 'services', name: 'Услуги', description: 'Консултантски услуги, агенции, професионални услуги' },
          { id: 'manufacturing', name: 'Производство / Фабрика', description: 'Производствени компании, private label, фабрики' },
          { id: 'retail', name: 'Трговија на мало / големо', description: 'Продавници, дистрибуција, малопродажба' },
          { id: 'hospitality', name: 'Угостителство / Туризам', description: 'Ресторани, хотели, туристички агенции' },
          { id: 'construction', name: 'Градежништво / Инженеринг', description: 'Градежни компании, архитекти, инженери' },
          { id: 'startup', name: 'Стартап / SaaS', description: 'Технолошки стартапи, софтверски компании' },
          { id: 'other', name: 'Друго', description: 'Останати индустрии' }
        ]);
      }
      setLoading(false);
    }
  };

  const fetchQuestions = async (industry) => {
    try {
      setLoading(true);
      const response = await api.get(`/mhc/questions?industry=${industry}`);
      if (response && response.success) {
        setCategories(response.data.categories);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Грешка при преземање на прашањата. Ве молиме обидете се повторно.');
      setLoading(false);
    }
  };

  const handleIndustrySelect = (industryId) => {
    setSelectedIndustry(industryId);
  };

  const handleContinueToQuestions = () => {
    if (!selectedIndustry) {
      setError('Ве молиме изберете индустрија.');
      return;
    }
    setError('');
    fetchQuestions(selectedIndustry);
    setStep('questionnaire');
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousCategory = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToIndustry = () => {
    setStep('industry');
    setCurrentCategoryIndex(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const answeredCount = Object.keys(answers).length;
    if (answeredCount < 10) {
      setError('Ве молиме одговорете на барем 10 прашања за пореална проценка.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await handleCreditOperation(
        async () => api.post('/mhc/evaluate', {
          answers: answers,
          industry: selectedIndustry
        }),
        'маркетинг здравствен преглед',
        1
      );

      if (!response) {
        setSubmitting(false);
        return;
      }

      if (response && response.success) {
        await refreshCredits();
        navigate(`/terminal/marketing-screening/report/${response.data._id}`);
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

  // Loading state
  if (loading) {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles["dashboard-layout"]}>
          <Sidebar />
          <main className={styles["dashboard-main"]}>
            <div className={styles["loading"]}>
              <p>Се вчитува...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error state with no data - only show if there's an auth/permission error
  if (error && (error.includes('автентифицирани') || error.includes('задолжителни')) && industries.length === 0) {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles["dashboard-layout"]}>
          <Sidebar />
          <main className={styles["dashboard-main"]}>
            <div className={styles["questionnaire-container"]}>
              <div className={styles["questionnaire-header"]}>
                <h1>Маркетинг здравствен преглед</h1>
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

  // Industry selection step
  if (step === 'industry') {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles["dashboard-layout"]}>
          <Sidebar />
          <main className={styles["dashboard-main"]}>
            <div className={styles["questionnaire-container"]}>
              <div className={styles["questionnaire-header"]}>
                <h1>Маркетинг здравствен преглед</h1>
                <p>
                  Добијте објективна проценка на вашите маркетинг активности и дознајте каде имате простор за подобрување.
                  Прашањата и препораките ќе бидат прилагодени на вашата индустрија.
                </p>
              </div>

              <div className={styles["company-size-section"]}>
                <label className={styles["company-size-label"]}>
                  Изберете ја индустријата на вашата компанија:
                </label>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '16px' }}>
                  Ова ни помага да ги прилагодиме прашањата и препораките на спецификите на вашиот бизнис.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                  {industries.map(industry => (
                    <label
                      key={industry.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px 12px',
                        border: selectedIndustry === industry.id ? '1px solid #1E4DB7' : '1px solid #e0e4e8',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: '#ffffff',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="radio"
                        name="industry"
                        value={industry.id}
                        checked={selectedIndustry === industry.id}
                        onChange={() => handleIndustrySelect(industry.id)}
                        style={{
                          marginRight: '10px',
                          width: '15px',
                          height: '15px',
                          accentColor: '#1E4DB7',
                          flexShrink: 0
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <span style={{
                          display: 'block',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          color: '#1a1a2e',
                          marginBottom: '2px'
                        }}>
                          {industry.name}
                        </span>
                        <span style={{
                          fontSize: '0.8rem',
                          color: '#6b7280',
                          lineHeight: '1.3',
                          display: 'block'
                        }}>
                          {industry.description}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className={styles["error-message"]}>
                  {error}
                </div>
              )}

              <div className={styles["navigation-buttons"]}>
                <button
                  type="button"
                  onClick={() => navigate('/terminal')}
                  className={styles["btn-secondary"]}
                >
                  Откажи
                </button>
                <button
                  type="button"
                  onClick={handleContinueToQuestions}
                  disabled={!selectedIndustry}
                  className={styles["btn-primary"]}
                >
                  Продолжи кон прашањата
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Questionnaire step - add safety check for empty categories
  if (categories.length === 0) {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles["dashboard-layout"]}>
          <Sidebar />
          <main className={styles["dashboard-main"]}>
            <div className={styles["loading"]}>
              <p>Се вчитуваат прашањата...</p>
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
              <h1>Маркетинг здравствен преглед</h1>
              <p>Одговорете на прашањата за да добиете персонализирана проценка на вашите маркетинг активности.</p>
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
                  Категорија {currentCategoryIndex + 1} од {categories.length}: {currentCategory?.name}
                </span>
              </div>
            </div>

            {/* Questions */}
            <form onSubmit={handleSubmit}>
              <div className={styles["questions-section"]}>
                <h2 className={styles["category-title"]}>{currentCategory?.name}</h2>

                {currentCategory?.questions.map((question, index) => (
                  <div key={question.id} className={styles["question-card"]}>
                    <div className={styles["question-number"]}>
                      Прашање {index + 1}
                      {question.isHighlyRelevant && (
                        <span style={{ marginLeft: '8px', color: '#059669', fontSize: '0.75rem' }}>
                          (важно за вашата индустрија)
                        </span>
                      )}
                    </div>
                    <div className={styles["question-text"]}>
                      {question.text}
                    </div>

                    <div className={styles["answer-options"]}>
                      {question.type === 'choice' && question.options ? (
                        // Choice questions
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
                      ) : question.type === 'scale' ? (
                        // Scale questions (1-10)
                        <div style={{ width: '100%' }}>
                          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '10px' }}>
                            {question.scaleDescription}
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                              <label
                                key={num}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '32px',
                                  height: '32px',
                                  border: answers[question.id] === String(num) ? '1px solid #1E4DB7' : '1px solid #e0e4e8',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  background: answers[question.id] === String(num) ? '#1E4DB7' : '#ffffff',
                                  color: answers[question.id] === String(num) ? '#ffffff' : '#374151',
                                  fontSize: '0.85rem',
                                  fontWeight: '500',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <input
                                  type="radio"
                                  name={question.id}
                                  value={num}
                                  checked={answers[question.id] === String(num)}
                                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                  style={{ display: 'none' }}
                                />
                                {num}
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : null}
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
                {currentCategoryIndex === 0 ? (
                  <button
                    type="button"
                    onClick={handleBackToIndustry}
                    className={styles["btn-secondary"]}
                  >
                    ← Промени индустрија
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePreviousCategory}
                    className={styles["btn-secondary"]}
                  >
                    ← Претходна категорија
                  </button>
                )}

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
                    disabled={submitting}
                    className={styles["btn-submit"]}
                  >
                    {submitting ? 'Се обработува...' : 'Генерирај извештај'}
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

export default MarketingQuestionnaire;

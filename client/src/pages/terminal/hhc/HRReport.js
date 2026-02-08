import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from '../../../styles/terminal/lhc/ComplianceCheck.module.css';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/terminal/Sidebar';
import api from '../../../services/api';

const HRReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    fetchAssessment();
  }, [id]);

  const fetchAssessment = async () => {
    try {
      const response = await api.get(`/hhc/hr/assessment/${id}`);
      if (response && response.success) {
        setAssessment(response.data);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching assessment:', err);
      setError('Грешка при преземање на извештајот. Ве молиме обидете се повторно.');
      setLoading(false);
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getGradeColor = (gradeKey) => {
    const colors = {
      critical: '#dc2626',
      unstable: '#ea580c',
      developing: '#ca8a04',
      mature: '#16a34a'
    };
    return colors[gradeKey] || '#6b7280';
  };

  const getLevelColor = (level) => {
    const colors = {
      low: '#dc2626',
      medium: '#ca8a04',
      high: '#16a34a'
    };
    return colors[level] || '#6b7280';
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: { text: 'Итно', color: '#dc2626', bg: '#fef2f2' },
      medium: { text: 'Важно', color: '#ca8a04', bg: '#fefce8' },
      low: { text: 'Препорачано', color: '#16a34a', bg: '#f0fdf4' }
    };
    return badges[priority] || badges.low;
  };

  if (loading) {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles["dashboard-layout"]}>
          <Sidebar />
          <main className={styles["dashboard-main"]}>
            <div className={styles["loading"]}>
              <p>Се вчитува извештајот...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles["dashboard-layout"]}>
          <Sidebar />
          <main className={styles["dashboard-main"]}>
            <div className={styles["error-container"]}>
              <h2>Грешка</h2>
              <p>{error || 'Извештајот не е пронајден.'}</p>
              <button
                onClick={() => navigate('/terminal/hr-screening')}
                className={styles["btn-primary"]}
              >
                Назад
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Group recommendations by category
  const groupedRecommendations = assessment.recommendations?.reduce((acc, rec) => {
    if (!acc[rec.category]) {
      acc[rec.category] = [];
    }
    acc[rec.category].push(rec);
    return acc;
  }, {}) || {};

  return (
    <div>
      <Header isTerminal={true} />

      <div className={styles["dashboard-layout"]}>
        <Sidebar />

        <main className={styles["dashboard-main"]}>
          <div className={styles["report-container"]}>
            {/* Header */}
            <div className={styles["report-header"]}>
              <h1>HR и Оперативен Health Check - Извештај</h1>
              <p className={styles["report-date"]}>
                Извештај генериран на: {new Date(assessment.createdAt).toLocaleDateString('mk-MK', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {/* Overall Score */}
            <div className={styles["score-section"]}>
              <div className={styles["score-card"]}>
                <div className={styles["score-percentage"]} style={{ color: getGradeColor(assessment.gradeKey) }}>
                  {assessment.gradeEmoji} {assessment.score}/{assessment.maxScore}
                </div>
                <div className={styles["score-label-excellent"]} style={{ color: getGradeColor(assessment.gradeKey) }}>
                  {assessment.grade}
                </div>
              </div>

              <div className={styles["score-bar-container"]}>
                <div
                  className={styles["score-bar"]}
                  style={{
                    width: `${assessment.percentage}%`,
                    backgroundColor: getGradeColor(assessment.gradeKey)
                  }}
                ></div>
              </div>

              <div className={styles["score-description"]}>
                <p>{assessment.gradeDescription}</p>
              </div>
            </div>

            {/* Category Scores */}
            <div className={styles["detailed-findings-section"]}>
              <h2>Резултати по категории</h2>

              {Object.entries(assessment.categoryScores || {}).map(([catKey, catData]) => (
                <div key={catKey} className={styles["category-findings"]}>
                  <button
                    className={styles["category-toggle"]}
                    onClick={() => toggleCategory(catKey)}
                  >
                    <span className={styles["category-toggle-icon"]}>
                      {expandedCategories[catKey] ? '▼' : '▶'}
                    </span>
                    <span className={styles["category-toggle-title"]}>
                      {catData.name}
                    </span>
                    <span
                      className={styles["category-toggle-count"]}
                      style={{ color: getLevelColor(catData.level) }}
                    >
                      {catData.score}/{catData.maxScore} ({catData.percentage}%)
                    </span>
                  </button>

                  {expandedCategories[catKey] && (
                    <div className={styles["category-findings-content"]}>
                      <div className={styles["finding-card"]} style={{
                        borderLeft: `4px solid ${getLevelColor(catData.level)}`
                      }}>
                        <div style={{ marginBottom: '1rem' }}>
                          <strong>Ниво:</strong>{' '}
                          <span style={{ color: getLevelColor(catData.level), fontWeight: 'bold' }}>
                            {catData.level === 'low' ? 'Ниско' : catData.level === 'medium' ? 'Средно' : 'Високо'}
                          </span>
                        </div>

                        {/* Category-specific recommendations */}
                        {groupedRecommendations[catData.name] && groupedRecommendations[catData.name].length > 0 && (
                          <div>
                            <strong>Препораки:</strong>
                            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                              {groupedRecommendations[catData.name].map((rec, idx) => {
                                const badge = getPriorityBadge(rec.priority);
                                return (
                                  <li key={idx} style={{ marginBottom: '0.5rem' }}>
                                    <span style={{
                                      fontSize: '0.75rem',
                                      padding: '0.125rem 0.5rem',
                                      borderRadius: '9999px',
                                      backgroundColor: badge.bg,
                                      color: badge.color,
                                      marginRight: '0.5rem'
                                    }}>
                                      {badge.text}
                                    </span>
                                    {rec.recommendation}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Plan */}
            {assessment.recommendations && assessment.recommendations.length > 0 && (
              <div className={styles["recommendations-section"]}>
                <h2>Акционен план - Сите препораки</h2>
                <p className={styles["recommendations-intro"]}>
                  Следниве активности ќе ви помогнат да ја подобрите оперативната ефикасност и HR практиките:
                </p>

                <div className={styles["recommendations-list"]}>
                  {assessment.recommendations.map((rec, index) => {
                    const badge = getPriorityBadge(rec.priority);
                    return (
                      <div key={index} className={styles["recommendation-item"]}>
                        <div className={styles["recommendation-checkbox"]}>
                          <input type="checkbox" id={`rec-${index}`} />
                        </div>
                        <label htmlFor={`rec-${index}`} className={styles["recommendation-text"]}>
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '9999px',
                            backgroundColor: badge.bg,
                            color: badge.color,
                            marginRight: '0.5rem'
                          }}>
                            {badge.text}
                          </span>
                          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                            [{rec.category}]
                          </span>{' '}
                          {rec.recommendation}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className={styles["report-actions"]}>
              <button
                onClick={() => navigate('/terminal/hr-screening')}
                className={styles["btn-secondary"]}
              >
                Нова проценка
              </button>
              <button
                onClick={() => window.print()}
                className={styles["btn-outline"]}
              >
                Печати извештај
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HRReport;

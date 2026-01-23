import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from '../../../styles/terminal/lhc/ComplianceCheck.module.css';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/terminal/Sidebar';
import api from '../../../services/api';

const GeneralReport = () => {
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
      const response = await api.get(`/lhc/general/assessment/${id}`);
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

  const groupFindingsBySourceCategory = () => {
    if (!assessment || !assessment.violations) return {};

    const grouped = {};
    assessment.violations.forEach(violation => {
      const key = violation.sourceCategoryName || 'Друго';
      if (!grouped[key]) {
        grouped[key] = {
          icon: violation.sourceCategoryIcon || '📋',
          findings: []
        };
      }
      grouped[key].findings.push(violation);
    });
    return grouped;
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'high':
        return styles["severity-high"];
      case 'medium':
        return styles["severity-medium"];
      case 'low':
        return styles["severity-low"];
      default:
        return styles["severity-none"];
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'high':
        return 'Висок ризик';
      case 'medium':
        return 'Среден ризик';
      case 'low':
        return 'Низок ризик';
      default:
        return 'Без санкција';
    }
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
                onClick={() => navigate('/terminal/legal-screening')}
                className={styles["btn-primary"]}
              >
                Назад кон категории
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const groupedFindings = groupFindingsBySourceCategory();

  return (
    <div>
      <Header isTerminal={true} />

      <div className={styles["dashboard-layout"]}>
        <Sidebar />

        <main className={styles["dashboard-main"]}>
          <div className={styles["report-container"]}>
            {/* Header */}
            <div className={styles["report-header"]}>
              <h1>Извештај - Брз правен здравствен преглед</h1>
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
                <div className={styles["score-percentage"]}>
                  {assessment.percentage}%
                </div>
                <div className={styles[`score-label-${assessment.gradeClass}`]}>
                  {assessment.grade}
                </div>
              </div>

              <div className={styles["score-bar-container"]}>
                <div
                  className={`${styles["score-bar"]} ${styles[`score-bar-${assessment.gradeClass}`]}`}
                  style={{ width: `${assessment.percentage}%` }}
                ></div>
              </div>

              <div className={styles["score-description"]}>
                <p>{assessment.gradeDescription}</p>
              </div>
            </div>

            {/* Category Breakdown */}
            {assessment.categoryBreakdown && (
              <div className={styles["category-breakdown-section"]}>
                <h2>📊 Резултати по категории</h2>
                <div className={styles["category-breakdown-grid"]}>
                  {Object.entries(assessment.categoryBreakdown).map(([catId, catData]) => (
                    catData.total > 0 && (
                      <div key={catId} className={styles["category-breakdown-card"]}>
                        <div className={styles["category-breakdown-header"]}>
                          <span className={styles["category-breakdown-icon"]}>{catData.icon}</span>
                          <span className={styles["category-breakdown-name"]}>{catData.name}</span>
                        </div>
                        <div className={styles["category-breakdown-score"]}>
                          <span className={styles["category-breakdown-percentage"]}>
                            {catData.percentage}%
                          </span>
                          <span className={styles["category-breakdown-details"]}>
                            {catData.total - catData.violations}/{catData.total} точни
                          </span>
                        </div>
                        <div className={styles["category-breakdown-bar"]}>
                          <div
                            className={styles["category-breakdown-bar-fill"]}
                            style={{
                              width: `${catData.percentage}%`,
                              backgroundColor: catData.percentage >= 70 ? '#10B981' :
                                catData.percentage >= 50 ? '#F59E0B' : '#EF4444'
                            }}
                          ></div>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Action Plan / Recommendations */}
            {assessment.recommendations && assessment.recommendations.length > 0 && (
              <div className={styles["recommendations-section"]}>
                <h2>📋 Акционен план - Препораки за постапување</h2>
                <p className={styles["recommendations-intro"]}>
                  За да ја подобрите усогласеноста, препорачуваме да преземете следниве активности:
                </p>

                <div className={styles["recommendations-list"]}>
                  {assessment.recommendations.map((recommendation, index) => (
                    <div key={index} className={styles["recommendation-item"]}>
                      <div className={styles["recommendation-checkbox"]}>
                        <input type="checkbox" id={`rec-${index}`} />
                      </div>
                      <label htmlFor={`rec-${index}`} className={styles["recommendation-text"]}>
                        <span className={styles["recommendation-category-badge"]}>
                          {recommendation.sourceCategoryName}
                        </span>
                        {recommendation.text}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Findings by Source Category */}
            <div className={styles["detailed-findings-section"]}>
              <h2>📊 Детален извештај по области</h2>
              <p className={styles["findings-intro"]}>
                Подолу е детален преглед на сите идентификувани пропусти, групирани по област:
              </p>

              {Object.entries(groupedFindings).map(([categoryName, categoryData]) => (
                <div key={categoryName} className={styles["category-findings"]}>
                  <button
                    className={styles["category-toggle"]}
                    onClick={() => toggleCategory(categoryName)}
                  >
                    <span className={styles["category-toggle-icon"]}>
                      {expandedCategories[categoryName] ? '▼' : '▶'}
                    </span>
                    <span className={styles["category-toggle-emoji"]}>
                      {categoryData.icon}
                    </span>
                    <span className={styles["category-toggle-title"]}>
                      {categoryName}
                    </span>
                    <span className={styles["category-toggle-count"]}>
                      ({categoryData.findings.length} пропусти)
                    </span>
                  </button>

                  {expandedCategories[categoryName] && (
                    <div className={styles["category-findings-content"]}>
                      {categoryData.findings.map((finding, index) => (
                        <div
                          key={index}
                          className={`${styles["finding-card"]} ${styles["finding-card-violation"]}`}
                        >
                          <div className={styles["finding-header"]}>
                            <span className={`${styles["severity-badge"]} ${getSeverityClass(finding.severity)}`}>
                              {getSeverityLabel(finding.severity)}
                            </span>
                            {finding.category && (
                              <span className={styles["finding-subcategory"]}>
                                {finding.category}
                              </span>
                            )}
                          </div>
                          <div className={styles["finding-question"]}>
                            <strong>Прашање:</strong> {finding.question}
                          </div>
                          <div className={styles["finding-article"]}>
                            <strong>Законска основа:</strong> {finding.article}
                          </div>
                          <div className={styles["finding-evaluation"]}>
                            {finding.finding}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* No violations message */}
              {assessment.violations.length === 0 && (
                <div className={styles["no-violations"]}>
                  <span className={styles["no-violations-icon"]}>🎉</span>
                  <p>Честитки! Не се идентификувани пропусти во проверените области.</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className={styles["report-actions"]}>
              <button
                onClick={() => navigate('/terminal/legal-screening')}
                className={styles["btn-secondary"]}
              >
                ← Назад кон категории
              </button>
              <button
                onClick={() => navigate('/terminal/legal-screening/general')}
                className={styles["btn-primary"]}
              >
                Направи нова проценка
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

export default GeneralReport;

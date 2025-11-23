import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from '../../../styles/terminal/lhc/ComplianceCheck.module.css';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/terminal/Sidebar';
import api from '../../../services/api';

const EmploymentReport = () => {
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
      const response = await api.get(`/lhc/employment/assessment/${id}`);
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

  const groupFindingsByCategory = () => {
    if (!assessment || !assessment.violations) return {};

    const grouped = {};
    assessment.violations.forEach(violation => {
      if (!grouped[violation.category]) {
        grouped[violation.category] = [];
      }
      grouped[violation.category].push(violation);
    });
    return grouped;
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

  const groupedFindings = groupFindingsByCategory();

  return (
    <div>
      <Header isTerminal={true} />

      <div className={styles["dashboard-layout"]}>
        <Sidebar />

        <main className={styles["dashboard-main"]}>
          <div className={styles["report-container"]}>
            {/* Header */}
            <div className={styles["report-header"]}>
              <h1>Извештај за усогласеност - Работни односи</h1>
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

            {/* Action Plan / Recommendations */}
            {assessment.recommendations && assessment.recommendations.length > 0 && (
              <div className={styles["recommendations-section"]}>
                <h2>📋 Акционен план - Препораки за постапување</h2>
                <p className={styles["recommendations-intro"]}>
                  За да ја подобрите усогласеноста со Законот за работните односи, препорачуваме да преземете следниве активности:
                </p>

                <div className={styles["recommendations-list"]}>
                  {assessment.recommendations.map((recommendation, index) => (
                    <div key={index} className={styles["recommendation-item"]}>
                      <div className={styles["recommendation-checkbox"]}>
                        <input type="checkbox" id={`rec-${index}`} />
                      </div>
                      <label htmlFor={`rec-${index}`} className={styles["recommendation-text"]}>
                        ✶ {recommendation}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Findings by Category */}
            <div className={styles["detailed-findings-section"]}>
              <h2>📊 Детален извештај по категории</h2>
              <p className={styles["findings-intro"]}>
                Подолу е детален преглед на сите прашања и наоди по секоја категорија:
              </p>

              {Object.entries(groupedFindings).map(([categoryName, findings]) => (
                <div key={categoryName} className={styles["category-findings"]}>
                  <button
                    className={styles["category-toggle"]}
                    onClick={() => toggleCategory(categoryName)}
                  >
                    <span className={styles["category-toggle-icon"]}>
                      {expandedCategories[categoryName] ? '▼' : '▶'}
                    </span>
                    <span className={styles["category-toggle-title"]}>
                      {categoryName}
                    </span>
                    <span className={styles["category-toggle-count"]}>
                      ({findings.length} прашања)
                    </span>
                  </button>

                  {expandedCategories[categoryName] && (
                    <div className={styles["category-findings-content"]}>
                      {findings.map((finding, index) => (
                        <div
                          key={index}
                          className={`${styles["finding-card"]} ${styles["finding-card-violation"]}`}
                        >
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
                onClick={() => navigate('/terminal/legal-screening/employment')}
                className={styles["btn-primary"]}
              >
                Направи нова проценка
              </button>
              <button
                onClick={() => window.print()}
                className={styles["btn-outline"]}
              >
                🖨️ Печати извештај
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmploymentReport;

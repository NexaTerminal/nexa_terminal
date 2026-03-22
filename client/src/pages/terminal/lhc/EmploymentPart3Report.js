import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from '../../../styles/terminal/lhc/ComplianceCheck.module.css';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/terminal/Sidebar';
import api from '../../../services/api';

const EmploymentPart3Report = () => {
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
      const response = await api.get(`/lhc/employment-part3/assessment/${id}`);
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

  const normalizeSeverity = (severity) => {
    if (severity === 'sanction1' || severity === 'sanction3' || severity === 'high') return 'high';
    if (severity === 'sanction2' || severity === 'medium') return 'medium';
    if (severity === 'low') return 'low';
    return 'none';
  };

  const getSeverityClass = (severity) => {
    return styles[`severity-${normalizeSeverity(severity)}`] || styles["severity-none"];
  };

  const getSeverityLabel = (severity) => {
    const level = normalizeSeverity(severity);
    if (level === 'high') return 'Висок ризик';
    if (level === 'medium') return 'Среден ризик';
    if (level === 'low') return 'Низок ризик';
    return 'Информативно';
  };

  const groupFindingsByCategory = () => {
    const findings = assessment?.allFindings || assessment?.violations || [];
    if (findings.length === 0) return {};

    const grouped = {};
    findings.forEach(finding => {
      if (!grouped[finding.category]) {
        grouped[finding.category] = [];
      }
      grouped[finding.category].push(finding);
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
            <div className={styles["report-header"]}>
              <h1>Извештај: Работно време и одмор (Дел 3)</h1>
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

            {assessment.recommendations && assessment.recommendations.length > 0 && (
              <div className={styles["recommendations-section"]}>
                <h2>Акционен план - Препораки за постапување</h2>
                <p className={styles["recommendations-intro"]}>
                  За да ја подобрите усогласеноста во делот на работно време и одмор, препорачуваме:
                </p>

                <div className={styles["recommendations-list"]}>
                  {assessment.recommendations.map((recommendation, index) => (
                    <div key={index} className={styles["recommendation-item"]}>
                      <div className={styles["recommendation-checkbox"]}>
                        <input type="checkbox" id={`rec-${index}`} />
                      </div>
                      <label htmlFor={`rec-${index}`} className={styles["recommendation-text"]}>
                        {recommendation}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles["detailed-findings-section"]}>
              <h2>Детален извештај по категории</h2>
              <p className={styles["findings-intro"]}>
                Подолу е детален преглед на сите одговори и наоди:
              </p>

              {Object.entries(groupedFindings).map(([categoryName, findings]) => {
                const compliantCount = findings.filter(f => f.isCompliant).length;
                const violationCount = findings.length - compliantCount;
                return (
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
                      ({findings.length} прашања - {compliantCount} усогласени, {violationCount} неусогласени)
                    </span>
                  </button>

                  {expandedCategories[categoryName] && (
                    <div className={styles["category-findings-content"]}>
                      {findings.map((finding, index) => (
                        <div
                          key={index}
                          className={`${styles["finding-card"]} ${finding.isCompliant ? styles["finding-card-compliant"] : styles["finding-card-violation"]}`}
                        >
                          <div className={styles["finding-header"]}>
                            <span className={`${styles["severity-badge"]} ${finding.isCompliant ? styles["severity-none"] : getSeverityClass(finding.severity)}`}>
                              {finding.isCompliant ? 'Усогласено' : getSeverityLabel(finding.severity)}
                            </span>
                          </div>
                          <div className={styles["finding-question"]}>
                            <strong>Прашање:</strong> {finding.question}
                          </div>
                          {finding.answer && (
                            <div className={styles["finding-answer"]}>
                              <strong>Ваш одговор:</strong> {finding.answer}
                            </div>
                          )}
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
                );
              })}
            </div>

            <div className={styles["report-actions"]}>
              <button
                onClick={() => navigate('/terminal/legal-screening')}
                className={styles["btn-secondary"]}
              >
                ← Назад кон категории
              </button>
              <button
                onClick={() => navigate('/terminal/legal-screening/employment-part3')}
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

export default EmploymentPart3Report;

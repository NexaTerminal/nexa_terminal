import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from '../../../styles/terminal/lhc/ComplianceCheck.module.css';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/terminal/Sidebar';
import api from '../../../services/api';

// Brand colors
const colors = {
  primary: '#1E4DB7',
  primary50: '#F0F7FF',
  primary100: '#E0EEFF',
  primary200: '#C7E2FF',
  primary300: '#A5D2FF',
  primary400: '#7BB8FF',
  dark: '#1a1a2e',
  darkGray: '#374151',
  gray: '#6b7280',
  border: '#e5e7eb',
  white: '#ffffff'
};

const MarketingReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    strengths: true,
    weaknesses: true,
    improvements: true,
    categories: false
  });

  useEffect(() => {
    fetchAssessment();
  }, [id]);

  const fetchAssessment = async () => {
    try {
      const response = await api.get(`/mhc/assessment/${id}`);
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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getCategoryLevelStyle = (level) => {
    // All use primary brand colors with dark readable text
    return {
      background: colors.primary50,
      color: colors.primary,
      border: `1px solid ${colors.primary200}`
    };
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
                onClick={() => navigate('/terminal/marketing-screening')}
                className={styles["btn-primary"]}
              >
                Нова проценка
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header isTerminal={true} />

      <div className={styles["dashboard-layout"]}>
        <Sidebar />

        <main className={styles["dashboard-main"]}>
          <div className={styles["report-container"]}>
            {/* Header */}
            <div className={styles["report-header"]}>
              <h1 style={{ color: colors.dark }}>Маркетинг здравствен преглед</h1>
              <p style={{ fontSize: '1.1rem', color: colors.darkGray, marginBottom: '8px' }}>
                <strong>{assessment.companyName}</strong> | {assessment.industryName}
              </p>
              <p className={styles["report-date"]} style={{ color: colors.gray }}>
                Извештај генериран на: {new Date(assessment.createdAt).toLocaleDateString('mk-MK', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {/* Maturity Level */}
            <div style={{
              background: colors.white,
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: `1px solid ${colors.border}`,
              borderLeft: `4px solid ${colors.primary}`
            }}>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: colors.primary,
                  marginBottom: '8px'
                }}
              >
                {assessment.maturityLevel}
              </div>
              <p style={{ color: colors.darkGray, fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                {assessment.maturityDescription}
              </p>
            </div>

            {/* Overall Assessment */}
            <div style={{
              background: colors.white,
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: `1px solid ${colors.border}`
            }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '12px', color: colors.dark }}>
                Општа оценка
              </h2>
              <p style={{ color: colors.darkGray, lineHeight: '1.7', fontSize: '1rem', margin: 0 }}>
                {assessment.overallAssessment}
              </p>
            </div>

            {/* Strengths */}
            {assessment.strengths && assessment.strengths.length > 0 && (
              <div style={{
                background: colors.white,
                padding: '24px',
                borderRadius: '12px',
                marginBottom: '24px',
                border: `1px solid ${colors.border}`
              }}>
                <button
                  onClick={() => toggleSection('strengths')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <span style={{ color: colors.primary }}>
                      {expandedSections.strengths ? '▼' : '▶'}
                    </span>
                    <span style={{ color: colors.dark }}>Силни страни</span>
                    <span style={{ fontSize: '0.9rem', color: colors.primary, fontWeight: 'normal' }}>
                      ({assessment.strengths.length})
                    </span>
                  </h2>
                </button>

                {expandedSections.strengths && (
                  <div style={{ marginTop: '16px' }}>
                    {assessment.strengths.map((strength, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '12px 16px',
                          background: colors.white,
                          borderRadius: '8px',
                          marginBottom: '8px',
                          borderLeft: `3px solid ${colors.primary}`,
                          border: `1px solid ${colors.border}`,
                          borderLeftWidth: '3px',
                          borderLeftColor: colors.primary
                        }}
                      >
                        <p style={{ margin: 0, color: colors.darkGray }}>{strength}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Weaknesses */}
            {assessment.weaknesses && assessment.weaknesses.length > 0 && (
              <div style={{
                background: colors.white,
                padding: '24px',
                borderRadius: '12px',
                marginBottom: '24px',
                border: `1px solid ${colors.border}`
              }}>
                <button
                  onClick={() => toggleSection('weaknesses')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <span style={{ color: colors.primary }}>
                      {expandedSections.weaknesses ? '▼' : '▶'}
                    </span>
                    <span style={{ color: colors.dark }}>Области за подобрување</span>
                    <span style={{ fontSize: '0.9rem', color: colors.primary, fontWeight: 'normal' }}>
                      ({assessment.weaknesses.length})
                    </span>
                  </h2>
                </button>

                {expandedSections.weaknesses && (
                  <div style={{ marginTop: '16px' }}>
                    {assessment.weaknesses.map((weakness, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '12px 16px',
                          background: colors.white,
                          borderRadius: '8px',
                          marginBottom: '8px',
                          border: `1px solid ${colors.border}`,
                          borderLeft: `3px solid ${colors.primary400}`
                        }}
                      >
                        <p style={{ margin: 0, color: colors.darkGray }}>{weakness}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Improvement Suggestions */}
            {assessment.improvements && assessment.improvements.length > 0 && (
              <div style={{
                background: colors.white,
                padding: '24px',
                borderRadius: '12px',
                marginBottom: '24px',
                border: `1px solid ${colors.border}`
              }}>
                <button
                  onClick={() => toggleSection('improvements')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <span style={{ color: colors.primary }}>
                      {expandedSections.improvements ? '▼' : '▶'}
                    </span>
                    <span style={{ color: colors.dark }}>Препораки за подобрување</span>
                    <span style={{ fontSize: '0.9rem', color: colors.gray, fontWeight: 'normal' }}>
                      ({assessment.improvements.length})
                    </span>
                  </h2>
                </button>

                {expandedSections.improvements && (
                  <div style={{ marginTop: '16px' }}>
                    <p style={{ color: colors.gray, marginBottom: '16px', fontSize: '0.95rem' }}>
                      Врз основа на вашите одговори, препорачуваме да се фокусирате на следните области:
                    </p>
                    {assessment.improvements.map((improvement, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '16px',
                          background: colors.white,
                          borderRadius: '8px',
                          marginBottom: '12px',
                          border: `1px solid ${colors.border}`
                        }}
                      >
                        <div style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          background: colors.primary,
                          color: colors.white,
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          marginBottom: '8px'
                        }}>
                          {improvement.area}
                        </div>
                        <p style={{ margin: 0, color: colors.darkGray, lineHeight: '1.6' }}>
                          {improvement.suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Category Analysis */}
            {assessment.categoryAnalysis && assessment.categoryAnalysis.length > 0 && (
              <div style={{
                background: colors.white,
                padding: '24px',
                borderRadius: '12px',
                marginBottom: '24px',
                border: `1px solid ${colors.border}`
              }}>
                <button
                  onClick={() => toggleSection('categories')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <span style={{ color: colors.primary }}>
                      {expandedSections.categories ? '▼' : '▶'}
                    </span>
                    <span style={{ color: colors.dark }}>Детална анализа по категории</span>
                  </h2>
                </button>

                {expandedSections.categories && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '12px'
                    }}>
                      {assessment.categoryAnalysis.map((cat, index) => {
                        const levelStyle = getCategoryLevelStyle(cat.level);
                        return (
                          <div
                            key={index}
                            style={{
                              padding: '16px',
                              background: colors.white,
                              borderRadius: '8px',
                              border: `1px solid ${colors.border}`
                            }}
                          >
                            <div style={{ fontWeight: '600', marginBottom: '8px', color: colors.dark }}>
                              {cat.category}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: '500',
                                ...levelStyle
                              }}>
                                {cat.level}
                              </span>
                              {cat.industryRelevance === 'висока' && (
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  background: colors.primary50,
                                  color: colors.primary,
                                  border: `1px solid ${colors.primary200}`
                                }}>
                                  важно за вашата индустрија
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Conclusion */}
            <div style={{
              background: colors.white,
              padding: '24px',
              borderRadius: '12px',
              marginTop: '24px',
              marginBottom: '24px',
              border: `1px solid ${colors.border}`
            }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '12px', color: colors.dark }}>
                Заклучок
              </h2>
              <p style={{ color: colors.darkGray, lineHeight: '1.7', margin: 0 }}>
                {assessment.conclusion}
              </p>
            </div>

            {/* Actions */}
            <div className={styles["report-actions"]}>
              <button
                onClick={() => navigate('/terminal')}
                className={styles["btn-secondary"]}
              >
                Назад кон терминал
              </button>
              <button
                onClick={() => navigate('/terminal/marketing-screening')}
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

export default MarketingReport;

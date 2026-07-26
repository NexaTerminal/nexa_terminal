import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from '../../../styles/terminal/lhc/ComplianceCheck.module.css';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/terminal/Sidebar';
import api from '../../../services/api';
import usePrintReport from '../../../hooks/usePrintReport';
import LhcDisclaimer from '../../../components/terminal/lhc/LhcDisclaimer';
import LhcCoverageNote from '../../../components/terminal/lhc/LhcCoverageNote';

const GDPRReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [printing, handlePrint] = usePrintReport();

  useEffect(() => {
    fetchAssessment();
  }, [id]);

  const fetchAssessment = async () => {
    try {
      const response = await api.get(`/lhc/gdpr/assessment/${id}`);
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
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  if (loading) {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles['dashboard-layout']}>
          <Sidebar />
          <main className={styles['dashboard-main']}>
            <div className={styles['loading']}><p>Се вчитува извештајот...</p></div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles['dashboard-layout']}>
          <Sidebar />
          <main className={styles['dashboard-main']}>
            <div className={styles['error-container']}>
              <h2>Грешка</h2>
              <p>{error || 'Извештајот не е пронајден.'}</p>
              <button onClick={() => navigate('/terminal/legal-screening')} className={styles['btn-primary']}>
                Назад кон категории
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ---- normalize (with graceful fallbacks for legacy records) -----------
  const overallPct = assessment.overallPct ?? assessment.percentage ?? 0;
  const bandLabel = assessment.bandLabel || assessment.grade || 'Резултат';
  const bandClass = assessment.bandClass || assessment.gradeClass || 'average';
  const bandDescription = assessment.bandDescription || assessment.gradeDescription || '';
  const categories = assessment.categories || [];
  const criticalFailures = assessment.criticalFailures || [];
  const remediationPlan = assessment.remediationPlan
    || (Array.isArray(assessment.recommendations)
        ? assessment.recommendations.map((r, i) => ({
            priority: i + 1,
            text: typeof r === 'string' ? r : r.text,
            legalBasis: typeof r === 'string' ? '' : (r.legalBasis || ''),
            critical: false
          }))
        : []);
  const findings = assessment.findings || assessment.allFindings || [];
  const legalReferences = assessment.legalReferences || [];
  const disclaimer = assessment.disclaimer;

  const findingSeverity = (f) => {
    // New schema uses points (0..3); legacy uses isCompliant.
    if (typeof f.points === 'number') {
      if (f.points >= 3) return { cls: 'severity-none', label: 'Усогласено', compliant: true };
      if (f.points === 2) return { cls: 'severity-medium', label: 'Делумно', compliant: false };
      return { cls: 'severity-high', label: 'Слабо', compliant: false };
    }
    return f.isCompliant
      ? { cls: 'severity-none', label: 'Усогласено', compliant: true }
      : { cls: 'severity-high', label: 'Пропуст', compliant: false };
  };

  // Group findings by category title for the detailed section.
  const groupedFindings = {};
  findings.forEach(f => {
    const key = f.categoryTitle || f.category || 'Останато';
    if (!groupedFindings[key]) groupedFindings[key] = [];
    groupedFindings[key].push(f);
  });

  return (
    <div>
      <Header isTerminal={true} />
      <div className={styles['dashboard-layout']}>
        <Sidebar />
        <main className={styles['dashboard-main']}>
          <div className={styles['report-container']}>
            <div className={styles['report-header']}>
              <h1>Извештај за усогласеност - Заштита на лични податоци (GDPR)</h1>
              <p className={styles['report-date']}>
                Извештај генериран на: {new Date(assessment.createdAt).toLocaleDateString('mk-MK', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>

            {/* Overall band */}
            <div className={styles['score-section']}>
              <div className={styles['score-card']}>
                <div className={styles['score-percentage']}>{overallPct}%</div>
                <div className={styles[`score-label-${bandClass}`]}>{bandLabel}</div>
              </div>
              <div className={styles['score-bar-container']}>
                <div
                  className={`${styles['score-bar']} ${styles[`score-bar-${bandClass}`]}`}
                  style={{ width: `${overallPct}%` }}
                ></div>
              </div>
              <div className={styles['score-description']}><p>{bandDescription}</p></div>
            </div>

            {/* Priority (critical) risks */}
            {criticalFailures.length > 0 && (
              <div className={styles['recommendations-section']}>
                <h2>⚠ Приоритетни ризици</h2>
                <p className={styles['recommendations-intro']}>
                  Следниве прашања се клучни за усогласеноста и бараат итно постапување:
                </p>
                <div className={styles['recommendations-list']}>
                  {criticalFailures.map((cf, index) => (
                    <div key={index} className={`${styles['finding-card']} ${styles['finding-card-violation']}`}>
                      <div className={styles['finding-question']}><strong>{cf.question}</strong></div>
                      {cf.selected && (
                        <div className={styles['finding-answer']}><strong>Ваш одговор:</strong> {cf.selected}</div>
                      )}
                      {cf.remediation && (
                        <div className={styles['finding-evaluation']}><strong>Што да направите:</strong> {cf.remediation}</div>
                      )}
                      {cf.legalBasis && (
                        <div className={styles['finding-article']}><strong>Правна основа:</strong> {cf.legalBasis}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remediation plan */}
            {remediationPlan.length > 0 && (
              <div className={styles['recommendations-section']}>
                <h2>📋 План за усогласување</h2>
                <p className={styles['recommendations-intro']}>
                  Подредени чекори (приоритетните и најслабите области се на врвот):
                </p>
                <div className={styles['recommendations-list']}>
                  {remediationPlan.map((r, index) => (
                    <div key={index} className={styles['recommendation-item']}>
                      <div className={styles['recommendation-checkbox']}>
                        <input type="checkbox" id={`rec-${index}`} />
                      </div>
                      <label htmlFor={`rec-${index}`} className={styles['recommendation-text']}>
                        {r.critical ? '⚠ ' : '✶ '}{r.text}
                        {r.legalBasis ? <span className={styles['recommendation-category-badge']}> · {r.legalBasis}</span> : null}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Per-category results */}
            {categories.length > 0 && (
              <div className={styles['category-breakdown-section']}>
                <h2>📊 Резултати по области</h2>
                <div className={styles['category-breakdown-grid']}>
                  {categories.map((c) => (
                    <div key={c.id} className={styles['category-breakdown-card']}>
                      <div className={styles['category-breakdown-header']}>
                        <span className={styles['category-breakdown-name']}>{c.title}</span>
                        <span className={styles['category-breakdown-percentage']}>{c.pct}%</span>
                      </div>
                      <div className={styles['category-breakdown-bar']}>
                        <div
                          className={`${styles['category-breakdown-bar-fill']} ${styles[`score-bar-${c.bandClass}`]}`}
                          style={{ width: `${c.pct}%` }}
                        ></div>
                      </div>
                      <div className={styles['category-breakdown-details']}>{c.verdict}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed findings by category */}
            {Object.keys(groupedFindings).length > 0 && (
              <div className={styles['detailed-findings-section']}>
                <h2>🔎 Детален преглед по прашања</h2>
                <p className={styles['findings-intro']}>Кликнете на област за да ги видите сите одговори и наоди:</p>
                {Object.entries(groupedFindings).map(([categoryName, items]) => {
                  const strong = items.filter(f => findingSeverity(f).compliant).length;
                  const weak = items.length - strong;
                  return (
                    <div key={categoryName} className={styles['category-findings']}>
                      <button className={styles['category-toggle']} onClick={() => toggleCategory(categoryName)}>
                        <span className={styles['category-toggle-icon']}>
                          {expandedCategories[categoryName] ? '▼' : '▶'}
                        </span>
                        <span className={styles['category-toggle-title']}>{categoryName}</span>
                        <span className={styles['category-toggle-count']}>
                          ({items.length} прашања - {strong} добри, {weak} за подобрување)
                        </span>
                      </button>
                      {(printing || expandedCategories[categoryName]) && (
                        <div className={styles['category-findings-content']}>
                          {items.map((finding, index) => {
                            const sev = findingSeverity(finding);
                            return (
                              <div
                                key={index}
                                className={`${styles['finding-card']} ${sev.compliant ? styles['finding-card-compliant'] : styles['finding-card-violation']}`}
                              >
                                <div className={styles['finding-header']}>
                                  <span className={`${styles['severity-badge']} ${styles[sev.cls]}`}>{sev.label}</span>
                                </div>
                                <div className={styles['finding-question']}><strong>Прашање:</strong> {finding.question}</div>
                                {(finding.answerLabel || finding.answer) && (
                                  <div className={styles['finding-answer']}>
                                    <strong>Ваш одговор:</strong> {finding.answerLabel || finding.answer}
                                  </div>
                                )}
                                <div className={styles['finding-article']}>
                                  <strong>Правна основа:</strong> {finding.legalBasis || finding.article}
                                </div>
                                {!sev.compliant && finding.remediation && (
                                  <div className={styles['finding-evaluation']}>
                                    <strong>Препорака:</strong> {finding.remediation}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legal references */}
            {legalReferences.length > 0 && (
              <div className={styles['recommendations-section']}>
                <h2>⚖ Правни референци</h2>
                <ul>
                  {legalReferences.map((ref, index) => (
                    <li key={index} className={styles['finding-article']}>{ref}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            <LhcCoverageNote coveragePct={assessment?.coveragePct} provisional={assessment?.provisional} />

            <LhcDisclaimer text={disclaimer} />

            {/* Actions */}
            <div className={styles['report-actions']}>
              <button onClick={() => navigate('/terminal/legal-screening')} className={styles['btn-secondary']}>
                ← Назад кон категории
              </button>
              <button onClick={() => navigate('/terminal/legal-screening/gdpr')} className={styles['btn-primary']}>
                Направи нова проценка
              </button>
              <button onClick={handlePrint} className={styles['btn-outline']}>
                🖨️ Печати извештај
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GDPRReport;

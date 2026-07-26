import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from '../../../styles/terminal/lhc/ComplianceCheck.module.css';
import Header from '../../common/Header';
import Sidebar from '../../terminal/Sidebar';
import api from '../../../services/api';
import usePrintReport from '../../../hooks/usePrintReport';
import LhcDisclaimer from './LhcDisclaimer';
import LhcCoverageNote from './LhcCoverageNote';

// Shared §6.2 report layout for every module scored through lhcScoring.js
// (Employment + Parts 1–4, Health & Safety, Archives). Each page passes its
// title, fetch base and retake path.
const severityClass = (severity) => {
  if (severity === 'critical' || severity === 'high') return styles['severity-high'];
  if (severity === 'medium') return styles['severity-medium'];
  if (severity === 'low') return styles['severity-low'];
  return styles['severity-none'];
};
const severityLabel = (severity) => {
  if (severity === 'critical') return 'Критичен ризик';
  if (severity === 'high') return 'Висок ризик';
  if (severity === 'medium') return 'Среден ризик';
  if (severity === 'low') return 'Низок ризик';
  return 'Информативно';
};

const LhcModuleReport = ({ title, fetchBase, retakePath, redFlagNote }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});
  const [printing, handlePrint] = usePrintReport();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await api.get(`${fetchBase}/${id}`);
        if (active && response && response.success) setAssessment(response.data);
      } catch (err) {
        console.error('Error fetching assessment:', err);
        if (active) setError('Грешка при преземање на извештајот. Ве молиме обидете се повторно.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, fetchBase]);

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

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

  const pct = assessment.percentage ?? assessment.scoreNumber ?? 0;
  const gradeClass = assessment.gradeClass || assessment.bandClass || 'average';
  const grade = assessment.grade || assessment.bandLabel || assessment.scoreLabel || 'Резултат';
  const gradeDescription = assessment.gradeDescription || assessment.bandDescription || '';
  const criticalFailures = assessment.criticalFailures || [];
  const riskItems = assessment.riskItems || [];
  const categories = assessment.categories || [];
  const remediationPlan = assessment.remediationPlan || [];
  const legalReferences = assessment.legalReferences || [];
  const findings = assessment.allFindings || assessment.violations || [];

  // group findings by category title
  const grouped = {};
  findings.forEach(f => {
    const key = f.category || 'Останато';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(f);
  });

  return (
    <div>
      <Header isTerminal={true} />
      <div className={styles['dashboard-layout']}>
        <Sidebar />
        <main className={styles['dashboard-main']}>
          <div className={styles['report-container']}>
            <div className={styles['report-header']}>
              <h1>{title}</h1>
              <p className={styles['report-date']}>
                Извештај генериран на: {new Date(assessment.createdAt).toLocaleDateString('mk-MK', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>

            {/* Overall band */}
            <div className={styles['score-section']}>
              <div className={styles['score-card']}>
                <div className={styles['score-percentage']}>{pct}%</div>
                <div className={styles[`score-label-${gradeClass}`]}>{grade}</div>
              </div>
              <div className={styles['score-bar-container']}>
                <div className={`${styles['score-bar']} ${styles[`score-bar-${gradeClass}`]}`} style={{ width: `${pct}%` }}></div>
              </div>
              <div className={styles['score-description']}><p>{gradeDescription}</p></div>
            </div>

            <LhcCoverageNote coveragePct={assessment.coveragePct} provisional={assessment.provisional} />

            {redFlagNote && assessment.redFlagTriggered && (
              <div className={`${styles['finding-card']} ${styles['finding-card-violation']}`}>
                🚩 {redFlagNote}
              </div>
            )}

            {/* Priority (critical) risks */}
            {criticalFailures.length > 0 && (
              <div className={styles['recommendations-section']}>
                <h2>⚠ Приоритетни ризици</h2>
                <p className={styles['recommendations-intro']}>
                  Следниве прашања се клучни за усогласеноста и бараат итно постапување:
                </p>
                <div className={styles['recommendations-list']}>
                  {criticalFailures.map((cf, i) => (
                    <div key={i} className={`${styles['finding-card']} ${styles['finding-card-violation']}`}>
                      <div className={styles['finding-question']}><strong>{cf.question}</strong></div>
                      {(cf.answer || cf.selected) && (
                        <div className={styles['finding-answer']}><strong>Ваш одговор:</strong> {cf.answer || cf.selected}</div>
                      )}
                      {cf.whyItMatters && (
                        <div className={styles['finding-answer']}><strong>Зошто е важно:</strong> {cf.whyItMatters}</div>
                      )}
                      {cf.remediation && (
                        <div className={styles['finding-evaluation']}><strong>Што да направите:</strong> {cf.remediation}</div>
                      )}
                      {(cf.legalRef || cf.legalBasis) && (
                        <div className={styles['finding-article']}><strong>Правна основа:</strong> {cf.legalRef || cf.legalBasis}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key risks (for modules without curated critical questions) */}
            {criticalFailures.length === 0 && riskItems.length > 0 && (
              <div className={styles['recommendations-section']}>
                <h2>⚠ Клучни ризици</h2>
                <p className={styles['recommendations-intro']}>
                  Овие пропусти носат највисок ризик од санкции — решете ги приоритетно:
                </p>
                <div className={styles['recommendations-list']}>
                  {riskItems.map((r, i) => (
                    <div key={i} className={`${styles['finding-card']} ${styles['finding-card-violation']}`}>
                      <div className={styles['finding-header']}>
                        <span className={`${styles['severity-badge']} ${severityClass(r.severity)}`}>{severityLabel(r.severity)}</span>
                      </div>
                      <div className={styles['finding-question']}><strong>{r.question}</strong></div>
                      {r.remediation && (
                        <div className={styles['finding-evaluation']}><strong>Што да направите:</strong> {r.remediation}</div>
                      )}
                      {r.sanctionHint && (
                        <div className={styles['finding-answer']}>{r.sanctionHint}</div>
                      )}
                      {r.legalRef && (
                        <div className={styles['finding-article']}><strong>Правна основа:</strong> {r.legalRef}</div>
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
                  {remediationPlan.map((r, i) => (
                    <div key={i} className={styles['recommendation-item']}>
                      <div className={styles['recommendation-checkbox']}>
                        <input type="checkbox" id={`rec-${i}`} />
                      </div>
                      <label htmlFor={`rec-${i}`} className={styles['recommendation-text']}>
                        {(r.severity === 'critical' || r.severity === 'high') ? '⚠ ' : '✶ '}{r.text}
                        {r.legalRef ? <span className={styles['recommendation-category-badge']}> · {r.legalRef}</span> : null}
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
                        <div className={`${styles['category-breakdown-bar-fill']} ${styles[`score-bar-${c.bandClass}`]}`} style={{ width: `${c.pct}%` }}></div>
                      </div>
                      <div className={styles['category-breakdown-details']}>{c.verdict}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed findings */}
            {Object.keys(grouped).length > 0 && (
              <div className={styles['detailed-findings-section']}>
                <h2>🔎 Детален преглед по прашања</h2>
                <p className={styles['findings-intro']}>Кликнете на област за да ги видите сите одговори и наоди:</p>
                {Object.entries(grouped).map(([cat, items]) => {
                  const good = items.filter(f => f.isCompliant).length;
                  const bad = items.length - good;
                  return (
                    <div key={cat} className={styles['category-findings']}>
                      <button className={styles['category-toggle']} onClick={() => toggle(cat)}>
                        <span className={styles['category-toggle-icon']}>{expanded[cat] ? '▼' : '▶'}</span>
                        <span className={styles['category-toggle-title']}>{cat}</span>
                        <span className={styles['category-toggle-count']}>({items.length} прашања - {good} усогласени, {bad} за подобрување)</span>
                      </button>
                      {(printing || expanded[cat]) && (
                        <div className={styles['category-findings-content']}>
                          {items.map((f, i) => (
                            <div key={i} className={`${styles['finding-card']} ${f.isCompliant ? styles['finding-card-compliant'] : styles['finding-card-violation']}`}>
                              <div className={styles['finding-header']}>
                                <span className={`${styles['severity-badge']} ${f.isCompliant ? styles['severity-none'] : severityClass(f.severity)}`}>
                                  {f.isCompliant ? 'Усогласено' : severityLabel(f.severity)}
                                </span>
                              </div>
                              <div className={styles['finding-question']}><strong>Прашање:</strong> {f.question}</div>
                              {f.answer && <div className={styles['finding-answer']}><strong>Ваш одговор:</strong> {f.answer}</div>}
                              <div className={styles['finding-article']}><strong>Правна основа:</strong> {f.article}</div>
                              <div className={styles['finding-evaluation']}>{f.finding}</div>
                            </div>
                          ))}
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
                  {legalReferences.map((ref, i) => (
                    <li key={i} className={styles['finding-article']}>{ref}</li>
                  ))}
                </ul>
              </div>
            )}

            <LhcDisclaimer text={assessment.disclaimer} />

            <div className={styles['report-actions']}>
              <button onClick={() => navigate('/terminal/legal-screening')} className={styles['btn-secondary']}>
                ← Назад кон категории
              </button>
              <button onClick={() => navigate(retakePath)} className={styles['btn-primary']}>
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

export default LhcModuleReport;

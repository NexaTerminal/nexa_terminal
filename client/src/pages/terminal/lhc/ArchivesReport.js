import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from '../../../styles/terminal/lhc/ComplianceCheck.module.css';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/terminal/Sidebar';
import api from '../../../services/api';
import usePrintReport from '../../../hooks/usePrintReport';

const ArchivesReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [printing, handlePrint] = usePrintReport();

  useEffect(() => { fetchAssessment(); }, [id]);

  const fetchAssessment = async () => {
    try {
      const response = await api.get(`/lhc/archives/assessment/${id}`);
      if (response && response.success) setAssessment(response.data);
    } catch (err) {
      setError('Грешка при преземање на извештајот. Ве молиме обидете се повторно.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category) =>
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));

  const normalizeSeverity = (severity) => {
    if (severity === 'high') return 'high';
    if (severity === 'medium') return 'medium';
    if (severity === 'low') return 'low';
    return 'none';
  };
  const getSeverityClass = (severity) => styles[`severity-${normalizeSeverity(severity)}`] || styles["severity-none"];
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
    findings.forEach(f => {
      if (!grouped[f.category]) grouped[f.category] = [];
      grouped[f.category].push(f);
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
            <div className={styles["loading"]}><p>Се вчитува извештајот...</p></div>
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
              <button onClick={() => navigate('/terminal/legal-screening')} className={styles["btn-primary"]}>
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
              <h1>Извештај за усогласеност — Архивско и канцелариско работење</h1>
              <p className={styles["report-date"]}>
                Извештај генериран на: {new Date(assessment.createdAt).toLocaleDateString('mk-MK', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>

            <div className={styles["score-section"]}>
              <div className={styles["score-card"]}>
                <div className={styles["score-percentage"]}>{assessment.percentage}%</div>
                <div className={styles[`score-label-${assessment.gradeClass}`]}>{assessment.grade}</div>
              </div>
              <div className={styles["score-bar-container"]}>
                <div
                  className={`${styles["score-bar"]} ${styles[`score-bar-${assessment.gradeClass}`]}`}
                  style={{ width: `${assessment.percentage}%` }}
                />
              </div>
              <div className={styles["score-description"]}>
                <p>{assessment.gradeDescription}</p>
                {assessment.redFlagTriggered && (
                  <p style={{ marginTop: 10, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 8, fontSize: 13.5 }}>
                    🚩 Активирана е црвена линија: едно или повеќе критични прашања имаат најлош одговор
                    (небезбедно чување, уништување трајна архива, отстапување кон странство или спречување на инспекција).
                    Ризикот автоматски е поставен на „Висок", без оглед на вкупниот процент.
                  </p>
                )}
              </div>
            </div>

            {assessment.recommendations && assessment.recommendations.length > 0 && (
              <div className={styles["recommendations-section"]}>
                <h2>📋 Акционен план — Препораки за постапување</h2>
                <p className={styles["recommendations-intro"]}>
                  За да ја подобрите усогласеноста до 1 јуни 2026, препорачуваме да преземете
                  следниве активности:
                </p>
                <div className={styles["recommendations-list"]}>
                  {assessment.recommendations.map((rec, index) => (
                    <div key={index} className={styles["recommendation-item"]}>
                      <div className={styles["recommendation-checkbox"]}>
                        <input type="checkbox" id={`rec-${index}`} />
                      </div>
                      <label htmlFor={`rec-${index}`} className={styles["recommendation-text"]}>
                        ✶ {rec}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles["detailed-findings-section"]}>
              <h2>📊 Детален извештај по категории</h2>
              <p className={styles["findings-intro"]}>
                Подолу е детален преглед на сите прашања и наоди по секоја категорија:
              </p>

              {Object.entries(groupedFindings).map(([categoryName, findings]) => {
                const compliantCount = findings.filter(f => f.isCompliant).length;
                const violationCount = findings.length - compliantCount;
                return (
                  <div key={categoryName} className={styles["category-findings"]}>
                    <button className={styles["category-toggle"]} onClick={() => toggleCategory(categoryName)}>
                      <span className={styles["category-toggle-icon"]}>
                        {expandedCategories[categoryName] ? '▼' : '▶'}
                      </span>
                      <span className={styles["category-toggle-title"]}>{categoryName}</span>
                      <span className={styles["category-toggle-count"]}>
                        ({findings.length} прашања — {compliantCount} усогласени, {violationCount} неусогласени)
                      </span>
                    </button>

                    {(printing || expandedCategories[categoryName]) && (
                      <div className={styles["category-findings-content"]}>
                        {findings.map((f, i) => (
                          <div key={i}
                               className={`${styles["finding-card"]} ${f.isCompliant ? styles["finding-card-compliant"] : styles["finding-card-violation"]}`}>
                            <div className={styles["finding-header"]}>
                              <span className={`${styles["severity-badge"]} ${f.isCompliant ? styles["severity-none"] : getSeverityClass(f.severity)}`}>
                                {f.isCompliant ? 'Усогласено' : getSeverityLabel(f.severity)}
                              </span>
                            </div>
                            <div className={styles["finding-question"]}>
                              <strong>Прашање:</strong> {f.question}
                            </div>
                            {f.answer && (
                              <div className={styles["finding-answer"]}>
                                <strong>Ваш одговор:</strong> {f.answer}
                              </div>
                            )}
                            <div className={styles["finding-article"]}>
                              <strong>Законска основа:</strong> {f.article}
                            </div>
                            <div className={styles["finding-evaluation"]}>{f.finding}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className={styles["report-actions"]}>
              <button onClick={() => navigate('/terminal/legal-screening')} className={styles["btn-secondary"]}>
                ← Назад кон категории
              </button>
              <button onClick={() => navigate('/terminal/legal-screening/archives')} className={styles["btn-primary"]}>
                Направи нова проценка
              </button>
              <button onClick={handlePrint} className={styles["btn-outline"]}>
                🖨️ Печати извештај
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ArchivesReport;

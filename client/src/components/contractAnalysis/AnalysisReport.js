import React from 'react';
import styles from '../../styles/terminal/ContractAnalysis.module.css';
import RiskBadge from './RiskBadge';
import ClauseCard from './ClauseCard';

function Section({ title, children }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function ZoneHeader({ title }) {
  return <div className={styles.zoneHeader}>{title}</div>;
}

function BulletList({ items }) {
  if (!items || items.length === 0) return <p className={styles.muted}>—</p>;
  return (
    <ul className={styles.bulletList}>
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  );
}

function RiskList({ items, emptyMsg }) {
  if (!items || items.length === 0) return <p className={styles.muted}>{emptyMsg || '—'}</p>;
  return items.map((r, i) => (
    <div key={i} className={styles.riskItem}>
      <div className={styles.riskItemHead}>
        <strong>{r.title}</strong> <RiskBadge level={r.severity} />
      </div>
      {r.description && <p>{r.description}</p>}
      {r.recommendation && (
        <p className={styles.suggestedFix}><strong>Препорака:</strong> {r.recommendation}</p>
      )}
    </div>
  ));
}

/* ---- Commercial rating badge (inverted: high = good deal = green) ---- */
const COMMERCIAL_LABELS = { high: 'добра зделка', medium: 'просечна', low: 'слаба' };
const COMMERCIAL_CLS = { high: 'risk_low', medium: 'risk_medium', low: 'risk_high' };
function CommercialBadge({ level }) {
  const cls = styles[COMMERCIAL_CLS[level]] || styles.risk_medium;
  return <span className={`${styles.riskBadge} ${cls}`}>{COMMERCIAL_LABELS[level] || level}</span>;
}

const COST_PRED = {
  fixed: { label: 'фиксни', cls: 'risk_low' },
  variable: { label: 'варијабилни', cls: 'risk_medium' },
  exposed: { label: 'изложени на раст', cls: 'risk_high' },
};

function CommercialScorecard({ cs }) {
  if (!cs) return null;
  const cp = COST_PRED[cs.costPredictability];
  return (
    <section className={styles.scorecard}>
      <div className={styles.scorecardHead}>
        <h3 className={styles.sectionTitle}>Деловен преглед</h3>
        {cs.commercialRating && (
          <span className={styles.scorecardRating}>
            Комерцијална оцена: <CommercialBadge level={cs.commercialRating} />
          </span>
        )}
      </div>
      {cs.dealVerdict && <p className={styles.verdict}>{cs.dealVerdict}</p>}
      <div className={styles.scoreGrid}>
        <div className={styles.scoreCell}>
          <span className={styles.scoreLabel}>Вкупна финансиска изложеност</span>
          <span className={styles.scoreValue}>{cs.totalFinancialExposure || '—'}</span>
        </div>
        <div className={styles.scoreCell}>
          <span className={styles.scoreLabel}>Најлош можен сценарио</span>
          <span className={styles.scoreValue}>{cs.worstCaseDownside || '—'}</span>
        </div>
        <div className={styles.scoreCell}>
          <span className={styles.scoreLabel}>Предвидливост на трошоци</span>
          <span className={styles.scoreValue}>
            {cp
              ? <span className={`${styles.riskBadge} ${styles[cp.cls]}`}>{cp.label}</span>
              : (cs.costPredictability || '—')}
          </span>
          {cs.costPredictabilityNote && <small className={styles.scoreNote}>{cs.costPredictabilityNote}</small>}
        </div>
        <div className={styles.scoreCell}>
          <span className={styles.scoreLabel}>Ефект врз готовински тек</span>
          <span className={styles.scoreValue}>{cs.cashFlowImpact || '—'}</span>
        </div>
      </div>
    </section>
  );
}

const BENCH = {
  favorable: { label: 'поповолно за вас', cls: 'risk_low' },
  standard: { label: 'стандардно', cls: 'badge_neutral' },
  unfavorable: { label: 'понеповолно за вас', cls: 'risk_high' },
};
function MarketBenchmarkBlock({ items }) {
  if (!items || items.length === 0) return <p className={styles.muted}>Нема податоци за пазарна споредба.</p>;
  return items.map((b, i) => {
    const a = BENCH[b.assessment];
    return (
      <div key={i} className={styles.benchItem}>
        <div className={styles.benchHead}>
          <strong>{b.term}</strong>
          {a && <span className={`${styles.riskBadge} ${styles[a.cls]}`}>{a.label}</span>}
        </div>
        <div className={styles.benchCols}>
          <div>
            <span className={styles.benchLabel}>Во овој договор</span>
            <p>{b.inThisContract || '—'}</p>
          </div>
          <div>
            <span className={styles.benchLabel}>Пазарна норма</span>
            <p>{b.marketNorm || '—'}</p>
          </div>
        </div>
      </div>
    );
  });
}

function HiddenCostsBlock({ items }) {
  if (!items || items.length === 0) {
    return <p className={styles.muted}>Не се идентификувани значајни скриени трошоци.</p>;
  }
  return items.map((c, i) => (
    <div key={i} className={styles.riskItem}>
      <strong>{c.item}</strong>
      {c.estimatedImpact && <p><em>Импликација:</em> {c.estimatedImpact}</p>}
      {c.whoBears && <p><em>Го сноси:</em> {c.whoBears}</p>}
      {c.howToMitigate && (
        <p className={styles.suggestedFix}><strong>Како да се ублажи:</strong> {c.howToMitigate}</p>
      )}
    </div>
  ));
}

function NegotiationPlaybookBlock({ items }) {
  if (!items || items.length === 0) return null;
  return items.map((p, i) => (
    <div key={i} className={styles.riskItem}>
      <div className={styles.riskItemHead}>
        <strong>{p.item}</strong>
        {p.isDealbreaker && (
          <span className={`${styles.riskBadge} ${styles.risk_high}`}>клучен услов</span>
        )}
      </div>
      {p.whatToAsk && <p><em>Побарајте:</em> {p.whatToAsk}</p>}
      {p.whyItMatters && <p><em>Зошто:</em> {p.whyItMatters}</p>}
      {p.fallbackPosition && (
        <p className={styles.suggestedFix}><strong>Резервна позиција:</strong> {p.fallbackPosition}</p>
      )}
    </div>
  ));
}

function TerminationBlock({ termination }) {
  if (!termination) return <p className={styles.muted}>Не е извршена анализа за раскинување.</p>;
  const t = termination;
  const Side = ({ label, data }) => (
    <div className={styles.riskItem}>
      <strong>{label}:</strong> {data?.allowed ? '✅ Да' : '❌ Не / нерегулирано'}
      {data?.conditions && <p><em>Услови:</em> {data.conditions}</p>}
      {data?.noticePeriod && <p><em>Отказен рок:</em> {data.noticePeriod}</p>}
      {data?.costsOrPenalties && <p><em>Трошоци/казни:</em> {data.costsOrPenalties}</p>}
    </div>
  );
  return (
    <>
      <Side label="Корисникот може еднострано да раскине" data={t.userCanTerminate} />
      <Side label="Другата страна може еднострано да раскине" data={t.counterpartyCanTerminate} />
      <div className={styles.riskItem}>
        <strong>Спогодбено (mutual) раскинување:</strong>{' '}
        {t.mutualTerminationAllowed ? '✅ Дозволено' : '❌ Не е изречно регулирано'}
        {t.mutualTerminationConditions && <p>{t.mutualTerminationConditions}</p>}
      </div>
      {t.userAssessment && (
        <div className={styles.riskItem}>
          <strong>Оценка за вас:</strong>
          <p>{t.userAssessment}</p>
        </div>
      )}
      {t.recommendation && (
        <p className={styles.suggestedFix}>
          <strong>Препорака:</strong> {t.recommendation}
        </p>
      )}
    </>
  );
}

function PenaltiesBlock({ penalties }) {
  if (!penalties || penalties.length === 0) {
    return <p className={styles.muted}>Не се идентификувани казнени клаузули или пенали во договорот.</p>;
  }
  return penalties.map((p, i) => (
    <div key={i} className={styles.riskItem}>
      <strong>{p.trigger}</strong>
      {typeof p.isFairForUser === 'boolean' && (
        <span className={`${styles.riskBadge} ${p.isFairForUser ? styles.risk_low : styles.risk_high}`}>
          {p.isFairForUser ? 'разумно' : 'неповолно за вас'}
        </span>
      )}
      {p.amount && <p><em>Износ:</em> {p.amount}</p>}
      {p.whoPays && <p><em>Плаќа:</em> {p.whoPays}</p>}
      {p.recommendation && (
        <p className={styles.suggestedFix}><strong>Препорака:</strong> {p.recommendation}</p>
      )}
    </div>
  ));
}

function LicensesBlock({ licenses }) {
  if (!licenses || licenses.length === 0) {
    return <p className={styles.muted}>Договорот не споменува специфични лиценци или дозволи.</p>;
  }
  return licenses.map((l, i) => (
    <div key={i} className={styles.riskItem}>
      <strong>{l.type}</strong>
      {l.requiredFrom && <p><em>Потребна од:</em> {l.requiredFrom}</p>}
      <p><em>Експлицитно во договор:</em> {l.explicitlyMentioned ? 'да' : 'не'}</p>
      {l.risk && <p>{l.risk}</p>}
    </div>
  ));
}

function LiabilityBlock({ liability }) {
  if (!liability) return <p className={styles.muted}>—</p>;
  const l = liability;
  return (
    <>
      <dl className={styles.kvList}>
        <dt>Лимит на одговорност</dt>
        <dd>{l.capExists ? (l.capValue || 'постои, износ нејасен') : 'нема лимит'}</dd>
        {l.exclusionsForUser && (<><dt>Исклучоци во ваша корист</dt><dd>{l.exclusionsForUser}</dd></>)}
        {l.exclusionsAgainstUser && (<><dt>Исклучоци против вас</dt><dd>{l.exclusionsAgainstUser}</dd></>)}
        {l.insuranceRequiredByContract && (<><dt>Осигурување побарано во договор</dt><dd>{l.insuranceRequiredByContract}</dd></>)}
        {l.securityInstruments && (<><dt>Инструменти за обезбедување</dt><dd>{l.securityInstruments}</dd></>)}
      </dl>
      {l.userShouldGetInsurance && (
        <div className={styles.riskItem}>
          <strong>🛡️ Препорака за осигурување:</strong>
          <p>{l.insuranceRecommendation || 'Размислете за деловно/професионално осигурување од одговорност.'}</p>
        </div>
      )}
      {l.recommendation && (
        <p className={styles.suggestedFix}><strong>Препорака:</strong> {l.recommendation}</p>
      )}
    </>
  );
}

export default function AnalysisReport({ report }) {
  if (!report) return null;
  const kt = report.keyTerms || {};
  const up = report.userPerspective || {};
  // Fall back to legacy topRisks if the new split fields are missing
  const legalRisks = report.legalRisks || report.topRisks || [];
  const commercialRisks = report.commercialRisks || [];
  const cs = report.commercialSummary;
  const benchmark = report.marketBenchmark || [];
  const hiddenCosts = report.hiddenCosts || [];
  const playbook = report.negotiationPlaybook || [];

  return (
    <div className={styles.report}>
      <div className={styles.disclaimerBanner}>
        ⚠️ {report.disclaimer || 'Оваа анализа е генерирана од АИ и не претставува правен совет.'}
      </div>

      <Section title="Резиме">
        <p>{report.summary}</p>
        <div className={styles.verdictRow}>
          <span>Вкупна оцена на ризик:</span> <RiskBadge level={up.overallRiskRating} />
        </div>
        {up.shortVerdict && <p className={styles.verdict}>{up.shortVerdict}</p>}
        {up.favoredParty && (
          <p className={styles.muted}>
            <em>Договорот повеќе ја фаворизира:</em> {up.favoredParty}
          </p>
        )}
      </Section>

      {/* Commercial highlights — business bottom line up top */}
      <CommercialScorecard cs={cs} />

      {benchmark.length > 0 && (
        <Section title="Пазарна споредба">
          <MarketBenchmarkBlock items={benchmark} />
        </Section>
      )}

      {/* ---------------- LEGAL ZONE ---------------- */}
      <ZoneHeader title="Правен дел" />

      <Section title="Страни">
        <ul className={styles.bulletList}>
          {(report.parties || []).map((p, i) => (
            <li key={i}>
              <strong>{p.name}</strong> — {p.role} {p.isUser && <em>(вие)</em>}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Клучни услови">
        <dl className={styles.kvList}>
          <dt>Предмет</dt><dd>{kt.subject || '—'}</dd>
          <dt>Траење</dt><dd>{kt.duration || '—'}</dd>
          <dt>Цена</dt><dd>{kt.price || '—'}</dd>
          <dt>Услови за плаќање</dt><dd>{kt.paymentTerms || '—'}</dd>
          <dt>Применливо право</dt><dd>{kt.governingLaw || '—'}</dd>
          <dt>Надлежен суд</dt><dd>{kt.jurisdiction || '—'}</dd>
          <dt>Решавање на спорови</dt><dd>{kt.disputeResolution || '—'}</dd>
        </dl>
      </Section>

      <Section title="Ваши обврски">
        <BulletList items={report.userObligations} />
      </Section>

      <Section title="Обврски на другата страна">
        <BulletList items={report.counterpartyObligations} />
      </Section>

      <Section title="Раскинување на договорот">
        <TerminationBlock termination={report.termination} />
      </Section>

      <Section title="Казни и пенали">
        <PenaltiesBlock penalties={report.penalties} />
      </Section>

      <Section title="Лиценци, дозволи и регулатива">
        <LicensesBlock licenses={report.licenses} />
      </Section>

      <Section title="Одговорност и осигурување">
        <LiabilityBlock liability={report.liability} />
      </Section>

      <Section title="Анализа клаузула по клаузула">
        {(report.clauses || []).length === 0
          ? <p className={styles.muted}>Не се идентификувани специфични клаузули.</p>
          : (report.clauses || []).map((c, i) => <ClauseCard key={i} clause={c} />)}
      </Section>

      <Section title="Правни ризици">
        <RiskList items={legalRisks} emptyMsg="Не се идентификувани значајни правни ризици." />
      </Section>

      <Section title="Што недостасува">
        {(report.missingClauses || []).length === 0
          ? <p className={styles.muted}>Сите стандардни клаузули се присутни.</p>
          : (report.missingClauses || []).map((m, i) => (
            <div key={i} className={styles.riskItem}>
              <strong>{m.name}</strong>
              {m.whyItMatters && <p>{m.whyItMatters}</p>}
              {m.suggestedText && (
                <p className={styles.suggestedFix}>
                  <strong>Предлог текст:</strong> {m.suggestedText}
                </p>
              )}
            </div>
          ))}
      </Section>

      {report.mkLawCompliance && (
        <Section title="Усогласеност со македонското право">
          <p>{report.mkLawCompliance}</p>
        </Section>
      )}

      {/* ---------------- COMMERCIAL ZONE ---------------- */}
      <ZoneHeader title="Комерцијален / деловен дел" />

      <Section title="Комерцијални ризици">
        <RiskList items={commercialRisks} emptyMsg="Не се идентификувани значајни комерцијални ризици." />
      </Section>

      {hiddenCosts.length > 0 && (
        <Section title="Скриени и вкупни трошоци">
          <HiddenCostsBlock items={hiddenCosts} />
        </Section>
      )}

      {playbook.length > 0 && (
        <Section title="План за преговори">
          <NegotiationPlaybookBlock items={playbook} />
        </Section>
      )}

      {report.negotiationPriorities && report.negotiationPriorities.length > 0 && (
        <Section title="Приоритети за преговори">
          <BulletList items={report.negotiationPriorities} />
        </Section>
      )}

      <Section title="Прашања за вашиот адвокат">
        <BulletList items={report.questionsForLawyer} />
      </Section>

      <div className={styles.disclaimerBanner}>
        ⚠️ {report.disclaimer || 'Оваа анализа е генерирана од АИ и не претставува правен совет.'}
      </div>
    </div>
  );
}

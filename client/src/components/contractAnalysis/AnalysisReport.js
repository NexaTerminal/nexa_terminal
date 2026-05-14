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

function BulletList({ items }) {
  if (!items || items.length === 0) return <p className={styles.muted}>—</p>;
  return (
    <ul className={styles.bulletList}>
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  );
}

export default function AnalysisReport({ report }) {
  if (!report) return null;
  const kt = report.keyTerms || {};
  const up = report.userPerspective || {};

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
      </Section>

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
        </dl>
      </Section>

      <Section title="Ваши обврски">
        <BulletList items={report.userObligations} />
      </Section>

      <Section title="Обврски на другата страна">
        <BulletList items={report.counterpartyObligations} />
      </Section>

      <Section title="Анализа клаузула по клаузула">
        {(report.clauses || []).length === 0
          ? <p className={styles.muted}>Не се идентификувани специфични клаузули.</p>
          : (report.clauses || []).map((c, i) => <ClauseCard key={i} clause={c} />)}
      </Section>

      <Section title="Главни ризици">
        {(report.topRisks || []).map((r, i) => (
          <div key={i} className={styles.riskItem}>
            <div className={styles.riskItemHead}>
              <strong>{r.title}</strong> <RiskBadge level={r.severity} />
            </div>
            <p>{r.description}</p>
            {r.recommendation && <p className={styles.suggestedFix}><strong>Препорака:</strong> {r.recommendation}</p>}
          </div>
        ))}
      </Section>

      <Section title="Што недостасува">
        {(report.missingClauses || []).length === 0
          ? <p className={styles.muted}>Сите стандардни клаузули се присутни.</p>
          : (report.missingClauses || []).map((m, i) => (
            <div key={i} className={styles.riskItem}>
              <strong>{m.name}</strong>
              <p>{m.whyItMatters}</p>
            </div>
          ))}
      </Section>

      {report.mkLawCompliance && (
        <Section title="Усогласеност со македонското право">
          <p>{report.mkLawCompliance}</p>
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

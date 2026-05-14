import React, { useState } from 'react';
import styles from '../../styles/terminal/ContractAnalysis.module.css';
import RiskBadge from './RiskBadge';

export default function ClauseCard({ clause }) {
  const [open, setOpen] = useState(clause.risk === 'high');
  return (
    <div className={styles.clauseCard}>
      <div className={styles.clauseHeader} onClick={() => setOpen(o => !o)}>
        <div className={styles.clauseHeaderLeft}>
          <span className={styles.clauseRef}>{clause.clauseRef || '—'}</span>
          <span className={styles.clauseTitle}>{clause.title}</span>
        </div>
        <div className={styles.clauseHeaderRight}>
          <RiskBadge level={clause.risk} />
          <span className={styles.chevron}>{open ? '▴' : '▾'}</span>
        </div>
      </div>
      {open && (
        <div className={styles.clauseBody}>
          <p>{clause.summary}</p>
          {clause.explanation && (
            <p><strong>Зошто е важно:</strong> {clause.explanation}</p>
          )}
          {clause.suggestedFix && (
            <p className={styles.suggestedFix}>
              <strong>Препорака:</strong> {clause.suggestedFix}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

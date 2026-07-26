import React from 'react';
import styles from '../../../styles/terminal/lhc/ComplianceCheck.module.css';

/**
 * Shows the assessment coverage and, when coverage is below the threshold,
 * a "provisional result" banner. Renders nothing for older records that have
 * no coverage data.
 */
const LhcCoverageNote = ({ coveragePct, provisional }) => {
  if (coveragePct === undefined || coveragePct === null) return null;
  return (
    <>
      {provisional && (
        <div className={styles['provisional-banner']}>
          ⏳ Прелиминарен резултат — довршете ја проценката за да добиете конечна оцена.
        </div>
      )}
      <div className={styles['coverage-note']}>
        Опфат на проценката: одговоривте на {coveragePct}% од применливите прашања.
      </div>
    </>
  );
};

export default LhcCoverageNote;

import React from 'react';
import styles from '../../../styles/terminal/lhc/ComplianceCheck.module.css';

// Canonical fallback so the disclaimer shows even on older assessment records
// that were saved before the server started returning a `disclaimer` field.
const DEFAULT_DISCLAIMER = 'Овој извештај претставува индикативна самопроценка и служи само за информативни цели. Не претставува правен совет, ниту задолжителни инструкции, ниту официјална оцена на надлежен орган — препораките и чекорите се само насоки. За конкретни прашања и за да ја потврдите вашата усогласеност со прописите, секогаш консултирајте адвокат или квалификуван правен застапник.';

/**
 * Standard "this is not legal advice" notice for every Legal Health Check report.
 */
const LhcDisclaimer = ({ text }) => (
  <div className={styles['report-disclaimer']}>
    ⚠ {text || DEFAULT_DISCLAIMER}
  </div>
);

export default LhcDisclaimer;

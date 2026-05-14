import React from 'react';
import styles from '../../styles/terminal/ContractAnalysis.module.css';

const LABELS = { low: 'низок', medium: 'среден', high: 'висок' };

export default function RiskBadge({ level }) {
  const cls = styles[`risk_${level}`] || styles.risk_low;
  return <span className={`${styles.riskBadge} ${cls}`}>{LABELS[level] || level}</span>;
}

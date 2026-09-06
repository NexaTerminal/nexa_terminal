import React from 'react';
import styles from '../../../styles/terminal/lhc/ComplianceCheck.module.css';
import { suggestDocs } from '../../../config/lhcDocumentMap';

// Per-finding next actions: one-click "generate the fixing document" chips
// (deterministic route map — never a dead link) + an "ask the AI" handoff that
// opens the chat preloaded with the finding. Shared by every LHC report.
export default function LhcFindingActions({ finding }) {
  const docs = suggestDocs(finding);
  const askQuery = encodeURIComponent(finding.question || finding.text || '');
  if (docs.length === 0 && !askQuery) return null;
  return (
    <div className={styles['finding-actions']}>
      {docs.map((d) => (
        <a key={d.url} href={d.url} className={styles['finding-action-doc']}>
          📄 Подготви: {d.label}
        </a>
      ))}
      {askQuery && (
        <a href={`/terminal/ai?q=${askQuery}`} className={styles['finding-action-ask']}>
          💬 Прашај го АИ за ова
        </a>
      )}
    </div>
  );
}

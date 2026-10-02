import React from 'react';
import styles from '../../../styles/terminal/lhc/ComplianceCheck.module.css';
import { suggestDocs } from '../../../config/lhcDocumentMap';
import { useChatDock } from '../../../contexts/ChatDockContext';

// Per-finding next actions: one-click "generate the fixing document" chips
// (deterministic route map — never a dead link) + an "ask the AI" handoff that
// opens the routed agent's chat balloon preloaded with the finding.
export default function LhcFindingActions({ finding, agentKey = 'legal' }) {
  const { openChat } = useChatDock();
  const docs = suggestDocs(finding);
  const q = (finding.question || finding.text || '').trim();
  if (docs.length === 0 && !q) return null;
  return (
    <div className={styles['finding-actions']}>
      {docs.map((d) => (
        <a key={d.url} href={d.url} className={styles['finding-action-doc']}>
          📄 Подготви: {d.label}
        </a>
      ))}
      {q && (
        <button
          type="button"
          className={styles['finding-action-ask']}
          onClick={() => openChat?.(agentKey, { seed: q })}
        >
          Прашај го АИ за ова
        </button>
      )}
    </div>
  );
}

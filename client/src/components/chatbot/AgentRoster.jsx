import React from 'react';
import { AI_AGENTS } from '../../config/aiAgents';
import styles from './AgentRoster.module.css';

/**
 * AgentRoster — the "AI Team" selector.
 *
 * Two layouts:
 *  - variant="bar"   → compact pills (chat header). Bio shown as tooltip.
 *  - variant="cards" → full cards with bio (empty-state picker).
 *
 * onSelect receives the full agent object; the parent decides what to do
 * (set active agent for legal engine, or navigate for marketing).
 */
export default function AgentRoster({ activeKey, onSelect, variant = 'bar' }) {
  if (variant === 'cards') {
    return (
      <div className={styles.cards}>
        {AI_AGENTS.map((a) => (
          <button
            key={a.key}
            type="button"
            className={`${styles.card} ${activeKey === a.key ? styles.cardActive : ''}`}
            onClick={() => onSelect?.(a)}
          >
            <span className={styles.cardIcon} aria-hidden="true">{a.icon}</span>
            <span className={styles.cardName}>{a.name}</span>
            <span className={styles.cardRole}>{a.role}</span>
            <span className={styles.cardBio}>{a.bio}</span>
            {a.hasContractReview && (
              <span className={styles.cardBadge}>Преглед на договори</span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.bar} role="tablist" aria-label="AI Тим">
      {AI_AGENTS.map((a) => (
        <button
          key={a.key}
          type="button"
          role="tab"
          aria-selected={activeKey === a.key}
          title={`${a.name} — ${a.role}: ${a.bio}`}
          className={`${styles.pill} ${activeKey === a.key ? styles.pillActive : ''}`}
          onClick={() => onSelect?.(a)}
        >
          <span className={styles.pillIcon} aria-hidden="true">{a.icon}</span>
          <span className={styles.pillName}>{a.name}</span>
          <span className={styles.pillRole}>{a.role}</span>
        </button>
      ))}
    </div>
  );
}

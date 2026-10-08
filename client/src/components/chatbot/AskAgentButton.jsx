import React from 'react';
import PropTypes from 'prop-types';
import { getAgent } from '../../config/aiAgents';
import { useChatDock } from '../../contexts/ChatDockContext';
import styles from './AskAgentButton.module.css';

/**
 * AskAgentButton — the reusable "character home" entry point. Drop it on any
 * feature page to open the right AI Team member in the chat dock, pre-seeded and
 * carrying a focus context about the thing on screen (a case, an employee, …).
 *
 * props:
 *  - agentKey: which character (legal/corporate/hr/…)
 *  - seed:     optional first question auto-asked on open
 *  - context:  optional { kind, label, data } artifact the thread is about (#1)
 *  - label:    button text (defaults to „Прашај <name>")
 */
export default function AskAgentButton({ agentKey, seed, context, label }) {
  const { openChat } = useChatDock();
  const agent = getAgent(agentKey);
  if (!agent || !openChat) return null;

  const onClick = () => {
    const opts = {};
    if (seed) opts.seed = seed;
    if (context) opts.context = context;
    openChat(agent.key, opts);
  };

  return (
    <button
      type="button"
      className={styles.btn}
      style={{ '--accent': agent.accent || '#1E4DB7' }}
      onClick={onClick}
      title={`Отвори чет со ${agent.name}`}
    >
      <span className={styles.avatar}>
        {agent.photo
          ? <img src={agent.photo} alt="" />
          : <span className={styles.avatarFallback}>{agent.icon}</span>}
      </span>
      <span className={styles.label}>{label || `Прашај ${agent.name}`}</span>
    </button>
  );
}

AskAgentButton.propTypes = {
  agentKey: PropTypes.string.isRequired,
  seed: PropTypes.string,
  context: PropTypes.object,
  label: PropTypes.string,
};

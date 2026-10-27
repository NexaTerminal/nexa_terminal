import React from 'react';
import PropTypes from 'prop-types';
import styles from './AiInviteLink.module.css';

/**
 * Group chat (user + human pro): the AI character stays silent until the user
 * invites it — one invite = one AI reply on the next message, then it is silent
 * again. Rendered as a quiet text link above the composer.
 */
const AiInviteLink = ({ agentName, armed, onToggle, waiting = false }) => (
  <div className={styles.row}>
    {waiting && <span className={styles.waiting}>🧑‍⚖️ Чекаме професионалец да се приклучи — пораките одат до него.</span>}
    <button type="button" className={`${styles.link} ${armed ? styles.armed : ''}`} onClick={onToggle}
      title={armed ? 'Откажи' : `${agentName} ќе одговори само на вашата следна порака`}>
      {armed ? `✓ ${agentName} ќе одговори на следната порака · откажи` : `🤖 Покани ${agentName} за коментар`}
    </button>
  </div>
);

AiInviteLink.propTypes = {
  agentName: PropTypes.string.isRequired,
  armed: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  waiting: PropTypes.bool,
};

export default AiInviteLink;

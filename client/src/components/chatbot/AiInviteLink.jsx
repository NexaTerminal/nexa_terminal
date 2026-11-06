import React from 'react';
import PropTypes from 'prop-types';
import styles from './AiInviteLink.module.css';

/**
 * Group chat (user + human pro): the AI character stays silent until the user
 * invites it — one invite = one AI reply on the next message, then it is silent
 * again. Rendered as a quiet text link above the composer. The chat surfaces also
 * pass the two ways out of a Pro thread: withdraw a waiting invite, or start a new
 * conversation with the AI.
 */
const AiInviteLink = ({ agentName, armed, onToggle, waiting = false, onCancelInvite, onNewChat, busy = false }) => (
  <div className={styles.row}>
    {waiting && <span className={styles.waiting}>🧑‍⚖️ Чекаме професионалец да се приклучи — пораките одат до него.</span>}
    <button type="button" className={`${styles.link} ${armed ? styles.armed : ''}`} onClick={onToggle}
      title={armed ? 'Откажи' : `${agentName} ќе одговори само на вашата следна порака`}>
      {armed ? `✓ ${agentName} ќе одговори на следната порака · откажи` : `🤖 Покани ${agentName} за коментар`}
    </button>
    {waiting && onCancelInvite && (
      <button type="button" className={styles.link} onClick={onCancelInvite} disabled={busy}
        title={`Поканата се повлекува и продолжувате со ${agentName}`}>
        Откажи покана
      </button>
    )}
    {onNewChat && (
      <button type="button" className={styles.link} onClick={onNewChat} disabled={busy}
        title="Овој разговор останува зачуван во „Разговори“">
        + Нов разговор со {agentName}
      </button>
    )}
  </div>
);

AiInviteLink.propTypes = {
  agentName: PropTypes.string.isRequired,
  armed: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  waiting: PropTypes.bool,
  onCancelInvite: PropTypes.func,
  onNewChat: PropTypes.func,
  busy: PropTypes.bool,
};

export default AiInviteLink;

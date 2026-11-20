import React from 'react';
import { getAgent } from '../../config/aiAgents';
import AgentName from '../chatbot/AgentName';
import styles from '../../styles/terminal/UpdatesFeed.module.css';

/**
 * Byline for an AI Team character in the feed (post author or comment reply):
 * photo, „Name·AI" and, unless compact, the character's role.
 */
const FeedAuthor = ({ agentKey, compact = false }) => {
  const a = getAgent(agentKey);
  if (!a) return null;
  return (
    <span className={`${styles.feedAuthor} ${compact ? styles.feedAuthorCompact : ''}`}>
      {a.photo
        ? <img src={a.photo} alt="" className={styles.feedAuthorPhoto} loading="lazy" />
        : <span className={styles.feedAuthorPhoto} aria-hidden>{a.icon}</span>}
      <span className={styles.feedAuthorText}>
        <span className={styles.feedAuthorName}><AgentName name={a.name} /></span>
        {!compact && <span className={styles.feedAuthorRole}>{a.role}</span>}
      </span>
    </span>
  );
};

// Opens the character's chat about a post (post = { title, body }), optionally
// with a specific question as the seed.
export const askAboutPost = (openChat, agentKey, post, question) => {
  const a = getAgent(agentKey);
  openChat?.(a.key, {
    seed: question || `Ја прочитав твојата објава „${post.title}". Што значи ова конкретно за мојата фирма?`,
    context: { kind: 'Објава во фидот', label: post.title, data: post.body || '' }
  });
};

export default FeedAuthor;

import React, { useEffect, useState } from 'react';
import ChatbotApiService from '../../services/chatbotApi';
import { getAgent } from '../../config/aiAgents';
import { useChatDock } from '../../contexts/ChatDockContext';
import styles from './DashboardNudges.module.css';

/**
 * DashboardNudges — proactive suggestions from the AI Team on the terminal home.
 * Each card opens the relevant character in the chat dock (with an optional seed),
 * turning the team from a tool you summon into an assistant that nudges you.
 * Renders nothing while loading or when there's nothing to suggest.
 */
export default function DashboardNudges() {
  const { openChat } = useChatDock();
  const [nudges, setNudges] = useState([]);

  useEffect(() => {
    let cancelled = false;
    ChatbotApiService.getNudges()
      .then((r) => { if (!cancelled && r?.success) setNudges(r.data?.nudges || []); })
      .catch(() => { if (!cancelled) setNudges([]); });
    return () => { cancelled = true; };
  }, []);

  if (!nudges.length || !openChat) return null;

  return (
    <section className={styles.wrap} aria-label="Предлози од AI тимот">
      <h2 className={styles.heading}>Твојот AI тим</h2>
      <div className={styles.cards}>
        {nudges.map((n) => {
          const agent = getAgent(n.agent);
          return (
            <button
              key={n.id}
              type="button"
              className={styles.card}
              style={{ '--accent': agent.accent || '#1E4DB7' }}
              onClick={() => openChat(n.agent, n.seed ? { seed: n.seed } : {})}
            >
              <span className={styles.avatar}>
                {agent.photo
                  ? <img src={agent.photo} alt={agent.name} />
                  : <span className={styles.avatarFallback}>{agent.icon}</span>}
              </span>
              <span className={styles.text}>
                <span className={styles.title}>{n.title}</span>
                {n.body && <span className={styles.body}>{n.body}</span>}
              </span>
              <span className={styles.arrow} aria-hidden="true">›</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

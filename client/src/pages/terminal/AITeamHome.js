import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import { AI_AGENTS } from '../../config/aiAgents';
import { useChatDock } from '../../contexts/ChatDockContext';
import styles from '../../styles/terminal/AITeamHome.module.css';

/**
 * AITeamHome — the "meet the team" landing for the AI Тим, styled like the
 * team section of a law-firm website: a tinted silhouette per agent with name,
 * role and short bio, plus quick actions (chat, and contract review where it
 * applies). Chat opens AIChat with the agent preselected via ?agent=.
 */
const Silhouette = ({ color }) => (
  <svg viewBox="0 0 120 120" className={styles.silhouette} aria-hidden="true">
    <defs>
      <linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.22" />
        <stop offset="100%" stopColor={color} stopOpacity="0.06" />
      </linearGradient>
    </defs>
    <circle cx="60" cy="60" r="60" fill={`url(#g-${color})`} />
    <g fill={color}>
      <circle cx="60" cy="46" r="20" />
      <path d="M26 104c0-20 15-32 34-32s34 12 34 32z" />
    </g>
  </svg>
);

const ChatIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const DocIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M9 13h6M9 17h6" />
  </svg>
);

export default function AITeamHome() {
  const { openChat } = useChatDock();

  return (
    <div>
      <Header isTerminal={true} />
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.grid}>
            {AI_AGENTS.map((a) => (
              <article
                key={a.key}
                className={`${styles.card} ${a.comingSoon ? styles.cardSoon : ''}`}
                style={{ '--accent': a.accent }}
              >
                {a.comingSoon && <span className={styles.soonBadge}>Наскоро</span>}
                <div className={styles.avatarWrap}>
                  {a.photo ? (
                    <img
                      src={a.photo}
                      alt={a.name}
                      className={`${styles.photo} ${a.comingSoon ? styles.photoSoon : ''}`}
                      loading="lazy"
                    />
                  ) : (
                    <Silhouette color={a.accent} />
                  )}
                  <span className={styles.avatarEmoji} aria-hidden="true">{a.icon}</span>
                </div>
                <h2 className={styles.name}>{a.name}</h2>
                <p className={styles.role}>{a.role}</p>
                <p className={styles.bio}>{a.bio}</p>

                {a.comingSoon ? (
                  <div className={styles.soonNote}>За брзо ќе се приклучи</div>
                ) : (
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.iconAction}
                      onClick={() => openChat?.(a.key)}
                      title={`Разговарај со ${a.name}`}
                    >
                      <ChatIcon /><span>Разговарај</span>
                    </button>
                    {a.hasContractReview && (
                      <Link
                        to={`/terminal/ai-chat?agent=${a.key}&review=1`}
                        className={styles.iconActionGhost}
                        title="Прегледај договор"
                      >
                        <DocIcon /><span>Прегледај договор</span>
                      </Link>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import { AI_AGENTS } from '../../config/aiAgents';
import { useChatDock } from '../../contexts/ChatDockContext';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/terminal/AITeamHome.module.css';

/**
 * AITeamHome — "your team" roster for the AI Тим. Framed as the user's own
 * staff: a personalised header with the company name and a live availability
 * count, then staff-profile cards (avatar, name + on-duty status, job title,
 * bio, specialty tags, and a chat CTA tinted in each specialist's colour).
 * Chat opens in the docked balloon; contract review deep-links into AIChat.
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
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const DocIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M9 13h6M9 17h6" />
  </svg>
);

// A single staff member in the roster.
const StaffCard = ({ agent: a, openChat }) => {
  const specialties = String(a.tagline || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <article
      className={`${styles.card} ${a.comingSoon ? styles.cardSoon : ''}`}
      style={{ '--accent': a.accent }}
    >
      <div className={styles.cardTop}>
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
        <div className={styles.idBlock}>
          <div className={styles.nameRow}>
            <h2 className={styles.name}>{a.name}</h2>
            <span className={`${styles.status} ${a.comingSoon ? styles.statusSoon : styles.statusLive}`}>
              <span className={styles.statusDot} aria-hidden="true" />
              {a.comingSoon ? 'Наскоро' : 'Достапен'}
            </span>
          </div>
          <p className={styles.role}>{a.role}</p>
        </div>
      </div>

      <p className={styles.bio}>{a.bio}</p>

      {specialties.length > 0 && (
        <div className={styles.tags}>
          {specialties.map((s) => (
            <span key={s} className={styles.tag}>{s}</span>
          ))}
        </div>
      )}

      {a.comingSoon ? (
        <div className={styles.soonNote}>Наскоро се приклучува на твојот тим</div>
      ) : (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryAction}
            onClick={() => openChat?.(a.key)}
            title={`Разговарај со ${a.name}`}
          >
            <ChatIcon /><span>Разговарај</span>
          </button>
          {a.hasContractReview && (
            <Link
              to={`/terminal/ai-chat?agent=${a.key}&review=1`}
              className={styles.ghostAction}
              title="Прегледај договор"
            >
              <DocIcon /><span>Прегледај договор</span>
            </Link>
          )}
        </div>
      )}
    </article>
  );
};

export default function AITeamHome() {
  const { openChat } = useChatDock();
  const { currentUser } = useAuth();

  const company = currentUser?.companyInfo?.companyName?.trim();
  const activeCount = AI_AGENTS.filter((a) => !a.comingSoon).length;
  const soonCount = AI_AGENTS.length - activeCount;

  return (
    <div>
      <Header isTerminal={true} />
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.container}>
          <header className={styles.pageHeader}>
            <span className={styles.eyebrow}>Твојот тим</span>
            <h1 className={styles.pageTitle}>
              {company
                ? <>Тимот на <span className={styles.company}>{company}</span></>
                : 'Твојот тим на специјалисти'}
            </h1>
            <p className={styles.pageSubtitle}>
              Твои посветени специјалисти, на располагање во секое време. Разговарај
              со нив како со свои колеги — тие се тука да работат за тебе.
            </p>
            <div className={styles.teamMeta}>
              <span className={styles.metaLive}>
                <span className={styles.metaDot} aria-hidden="true" />
                {activeCount} достапни сега
              </span>
              {soonCount > 0 && (
                <span className={styles.metaMuted}>наскоро уште {soonCount}</span>
              )}
            </div>
          </header>

          <div className={styles.grid}>
            {AI_AGENTS.map((a) => (
              <StaffCard key={a.key} agent={a} openChat={openChat} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChatDock } from '../../contexts/ChatDockContext';
import { AI_AGENTS } from '../../config/aiAgents';
import ProRequestsApiService from '../../services/proRequestsApi';
import ChatbotApiService from '../../services/chatbotApi';
import { useInboxCount, isProUser } from '../../lib/inbox';
import { viewerRoleFor, counterpartName } from './ProChatWindow';
import styles from './MessagingBar.module.css';

const AI_CHARACTERS = AI_AGENTS.filter((a) => !a.comingSoon);
const MOBILE_QUERY = '(max-width: 560px)';

function statusLine(item, role) {
  if (item.status === 'open') return '⏳ Се бара професионалец…';
  if (item.status === 'closed') return '✓ Завршено';
  if (role === 'pro' && item.awaitingPro) return '🔴 Чека ваш одговор';
  return '💬 Во разговор';
}

function fmtWhen(d) {
  if (!d) return '';
  const date = new Date(d);
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString('mk-MK', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('mk-MK', { day: 'numeric', month: 'short' });
}

/**
 * MessagingBar — LinkedIn-style „Разговори" bar pinned to the bottom-right
 * corner (rightmost item of the chat dock). Collapsed: avatar + label + unread
 * badge. Expanded: conversations with professionals and the AI team; each opens
 * as a docked chat window beside the bar. Replaces the sidebar „Разговори" link.
 */
export default function MessagingBar() {
  const { currentUser } = useAuth();
  const { openChat, windows = [] } = useChatDock();
  // Phones: an open chat window is full-screen, so the bubble steps aside.
  const chatOpen = windows.some((w) => !w.minimized);
  const unread = useInboxCount(currentUser);
  const pro = isProUser(currentUser);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('pros');
  const [convos, setConvos] = useState(null);
  const [invites, setInvites] = useState(0);
  const [aiLatest, setAiLatest] = useState({});

  // Reserve room at the bottom of pages so the bar never covers the last content.
  useEffect(() => {
    document.body.classList.add('nexa-msgbar-on');
    return () => document.body.classList.remove('nexa-msgbar-on');
  }, []);

  // Phones: the open panel is a full-screen sheet — stop the page behind it scrolling.
  useEffect(() => {
    if (!open) return undefined;
    document.body.classList.add('nexa-msgsheet-open');
    return () => document.body.classList.remove('nexa-msgsheet-open');
  }, [open]);

  const loadConvos = useCallback(async () => {
    try {
      const [mine, assigned, board] = await Promise.all([
        ProRequestsApiService.list('mine').catch(() => null),
        pro ? ProRequestsApiService.list('assigned').catch(() => null) : null,
        pro ? ProRequestsApiService.board().catch(() => null) : null,
      ]);
      const seen = new Set();
      const merged = [...(mine?.items || []), ...(assigned?.items || [])]
        .filter((i) => i.status !== 'rejected' && !seen.has(i._id) && seen.add(i._id))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setConvos(merged);
      setInvites(board?.items?.length || 0);
    } catch (_) { setConvos([]); }
  }, [pro]);

  const loadAi = useCallback(async () => {
    try {
      const res = await ChatbotApiService.getConversations(30, 0);
      const latest = {};
      (res?.data?.conversations || []).forEach((c) => {
        if (c.agent && !latest[c.agent]) latest[c.agent] = c; // list is newest-first
      });
      setAiLatest(latest);
    } catch (_) { /* previews are optional */ }
  }, []);

  // Refresh the open panel when it opens and whenever the unread count moves.
  useEffect(() => {
    if (!open) return;
    if (tab === 'pros') loadConvos(); else loadAi();
  }, [open, tab, unread, loadConvos, loadAi]);

  const openItem = (key) => {
    openChat?.(key);
    if (window.matchMedia?.(MOBILE_QUERY).matches) setOpen(false); // sheet would cover the chat
  };

  const initial = (currentUser?.companyInfo?.companyName || currentUser?.username || currentUser?.email || '?')
    .trim().charAt(0).toUpperCase();
  const allHref = pro ? '/terminal/pro/conversations' : '/terminal/requests';

  return (
    <div className={`${styles.bar} ${open ? styles.barOpen : ''} ${chatOpen && !open ? styles.chatOpen : ''}`}>
      <button
        type="button"
        className={styles.head}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={unread ? `Разговори, ${unread} нови` : 'Разговори'}
      >
        <span className={styles.avatar} aria-hidden>{initial}</span>
        <span className={styles.label}>Разговори</span>
        {unread > 0 && <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>}
        <svg className={styles.chevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d={open ? 'M6 9l6 6 6-6' : 'M6 15l6-6 6 6'} />
        </svg>
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.tabs} role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'pros'}
              className={`${styles.tab} ${tab === 'pros' ? styles.tabActive : ''}`} onClick={() => setTab('pros')}>
              Професионалци
            </button>
            <button type="button" role="tab" aria-selected={tab === 'ai'}
              className={`${styles.tab} ${tab === 'ai' ? styles.tabActive : ''}`} onClick={() => setTab('ai')}>
              AI тим
            </button>
          </div>

          <div className={styles.list}>
            {tab === 'pros' && (
              <>
                {pro && invites > 0 && (
                  <Link to="/terminal/pro/conversations" className={styles.invites} onClick={() => setOpen(false)}>
                    📨 {invites} {invites === 1 ? 'отворена покана' : 'отворени покани'} за разговор →
                  </Link>
                )}
                {convos === null && <div className={styles.note}>Се вчитува…</div>}
                {convos && convos.length === 0 && (
                  <div className={styles.note}>
                    Сè уште немате разговори со професионалци. Поканете професионалец од разговор со AI тимот.
                  </div>
                )}
                {(convos || []).map((item) => {
                  const role = viewerRoleFor(item, currentUser);
                  const name = counterpartName(item, role);
                  const isUnread = role === 'user' ? item.unreadForUser > 0 : !!item.awaitingPro;
                  return (
                    <button key={item._id} type="button" className={`${styles.row} ${isUnread ? styles.rowUnread : ''}`}
                      onClick={() => openItem(`pro:${item._id}`)}>
                      <span className={`${styles.rowAvatar} ${styles.rowAvatarPro}`} aria-hidden>{name.trim().charAt(0).toUpperCase()}</span>
                      <span className={styles.rowText}>
                        <span className={styles.rowTop}>
                          <span className={styles.rowName}>{name}</span>
                          <span className={styles.rowTime}>{fmtWhen(item.updatedAt)}</span>
                        </span>
                        <span className={styles.rowSub}>{item.subject}</span>
                        <span className={styles.rowStatus}>{statusLine(item, role)}</span>
                      </span>
                      {isUnread && <span className={styles.dot} aria-label="Ново" />}
                    </button>
                  );
                })}
              </>
            )}

            {tab === 'ai' && AI_CHARACTERS.map((a) => {
              const last = aiLatest[a.key];
              return (
                <button key={a.key} type="button" className={styles.row} onClick={() => openItem(a.key)}>
                  {a.photo
                    ? <img src={a.photo} alt="" className={styles.rowAvatar} loading="lazy" />
                    : <span className={styles.rowAvatar} aria-hidden>{a.icon}</span>}
                  <span className={styles.rowText}>
                    <span className={styles.rowTop}>
                      <span className={styles.rowName}>{a.name}</span>
                      {last && <span className={styles.rowTime}>{fmtWhen(last.updatedAt)}</span>}
                    </span>
                    <span className={styles.rowSub}>{last?.title || a.role}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <Link to={allHref} className={styles.footer} onClick={() => setOpen(false)}>
            Види ги сите разговори →
          </Link>
        </div>
      )}
    </div>
  );
}

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ProRequestThread from '../proRequests/ProRequestThread';
import ProRequestsApiService from '../../services/proRequestsApi';
import { refreshInbox } from '../../lib/inbox';
import { getAgent } from '../../config/aiAgents';
import styles from './AgentChatDock.module.css';

// The viewer's side of a request: owner → 'user', assigned → 'pro', else admin.
export function viewerRoleFor(request, user) {
  const me = String(user?._id || '');
  if (request?.userId === me) return 'user';
  if (request?.assignedProId === me) return 'pro';
  return 'admin';
}

// Who the conversation is "with", from the viewer's side.
export function counterpartName(request, role) {
  if (role === 'user') return request.assignedProName || 'Се бара професионалец';
  return request.companyName || request.userName || 'Анонимен клиент';
}

const fullPagePath = (role, id) =>
  `${role === 'user' ? '/terminal/requests' : '/terminal/pro/conversations'}?id=${id}`;

/**
 * ProChatWindow — a human↔human „Разговори" conversation (Ask-a-Pro request)
 * docked next to the messaging bar, same chrome as the AI ChatWindow. Re-fetches
 * every ~15s while active so each side sees new messages.
 */
export default function ProChatWindow({ requestId, minimized, onClose, onToggle }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [request, setRequest] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await ProRequestsApiService.get(requestId);
      if (res?.success && res.item) { setRequest(res.item); setError(null); refreshInbox(); }
      else setError(res?.message || 'Разговорот не може да се вчита.');
    } catch (e) { setError(e.message || 'Разговорот не може да се вчита.'); }
  }, [requestId]);

  useEffect(() => { load(); }, [load]);

  const active = request?.status === 'active';
  useEffect(() => {
    if (!active || minimized) return;
    const iv = setInterval(load, 15000);
    window.addEventListener('focus', load);
    return () => { clearInterval(iv); window.removeEventListener('focus', load); };
  }, [active, minimized, load]);

  const onUpdated = (item) => { if (item) setRequest(item); refreshInbox(); };

  const role = request ? viewerRoleFor(request, currentUser) : 'user';
  const name = request ? counterpartName(request, role) : 'Разговор';
  // Group chat: the AI character the conversation started with is a participant too.
  const aiName = request?.agent ? getAgent(request.agent)?.name : null;
  const subtitle = aiName ? `Групен разговор · со ${aiName} (AI)` : (request?.subject || 'Разговор со професионалец');
  const stop = (fn) => (e) => { e.stopPropagation(); fn(); };
  const openFull = () => { navigate(fullPagePath(role, requestId)); onClose(); };

  return (
    <div className={`${styles.dock} ${minimized ? styles.dockMin : ''}`}>
      <button className={`${styles.header} ${styles.headerPro}`} onClick={onToggle} aria-label="Прошири/собери">
        <span className={styles.hdLeft}>
          <span className={`${styles.hdAvatarFallback} ${styles.hdAvatarPro}`}>{name.trim().charAt(0).toUpperCase()}</span>
          <span className={styles.hdText}>
            <span className={styles.hdName}>{name}</span>
            <span className={styles.hdRole} title={request?.subject || ''}>{subtitle}</span>
          </span>
        </span>
        <span className={styles.hdActions}>
          <span role="button" tabIndex={0} className={styles.iconBtn} title="Отвори цела страница"
            onClick={stop(openFull)}
            onKeyDown={(e) => { if (e.key === 'Enter') stop(openFull)(e); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M10 14L21 3M21 14v7H3V3h7" /></svg>
          </span>
          <span role="button" tabIndex={0} className={styles.iconBtn} title={minimized ? 'Отвори' : 'Собери'}
            onClick={stop(onToggle)}
            onKeyDown={(e) => { if (e.key === 'Enter') stop(onToggle)(e); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={minimized ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} /></svg>
          </span>
          <span role="button" tabIndex={0} className={styles.iconBtn} title="Затвори"
            onClick={stop(onClose)}
            onKeyDown={(e) => { if (e.key === 'Enter') stop(onClose)(e); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </span>
        </span>
      </button>

      {!minimized && (
        <div className={styles.proWindowBody}>
          {error && <div className={styles.proWindowNote}>⚠️ {error}</div>}
          {!error && !request && <div className={styles.proWindowNote}>Се вчитува…</div>}
          {request && <ProRequestThread request={request} role={role} onUpdated={onUpdated} compact />}
        </div>
      )}
    </div>
  );
}

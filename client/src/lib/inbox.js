import { useEffect, useState } from 'react';
import ProRequestsApiService from '../services/proRequestsApi';

// Fired after anything that changes the counts (sending a reply, opening a
// conversation) for an immediate badge refresh. Same event name the Sidebar
// used, so existing dispatchers keep working.
export const INBOX_REFRESH_EVENT = 'nexa:pro-unanswered-refresh';

export const refreshInbox = () => window.dispatchEvent(new Event(INBOX_REFRESH_EVENT));

export const isProUser = (user) => user?.role === 'admin_user' || user?.role === 'admin';

/**
 * Messaging-bar badge: requester side = conversations with unseen pro replies;
 * Pro side = active conversations waiting on their reply. Polls every minute,
 * on window focus and on INBOX_REFRESH_EVENT.
 */
export function useInboxCount(user) {
  const [count, setCount] = useState(0);
  const userId = user?._id;
  const pro = isProUser(user);
  useEffect(() => {
    if (!userId) { setCount(0); return; }
    let cancelled = false;
    const load = async () => {
      try {
        const [mine, waiting] = await Promise.all([
          ProRequestsApiService.unread().catch(() => null),
          pro ? ProRequestsApiService.unanswered().catch(() => null) : null,
        ]);
        if (!cancelled) setCount((mine?.count || 0) + (waiting?.count || 0));
      } catch (_) { /* badge is best-effort */ }
    };
    load();
    const iv = setInterval(load, 60000);
    window.addEventListener('focus', load);
    window.addEventListener(INBOX_REFRESH_EVENT, load);
    return () => {
      cancelled = true; clearInterval(iv);
      window.removeEventListener('focus', load);
      window.removeEventListener(INBOX_REFRESH_EVENT, load);
    };
  }, [userId, pro]);
  return count;
}

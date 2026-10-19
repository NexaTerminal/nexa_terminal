/**
 * Shared helpers to surface a claimed pro's replies inside the AI chat.
 *
 * The AI turns live in the chatbot conversation; the human pro's turns live in
 * the linked `pro_requests` thread (context.conversationId === conversationId).
 * Both stores stay authoritative — we MERGE them for display. Pro turns persist
 * in pro_requests, so they survive reloads by being re-fetched + re-merged.
 *
 * Used by both chat surfaces: AIChat.jsx (full page) and AgentChatDock.jsx (dock).
 */
import ProRequestsApiService from '../services/proRequestsApi';

/**
 * Find the active (claimed) pro request linked to this conversation, with its
 * pro-authored messages normalized to the chat message shape ({ type: 'pro' }).
 * Returns null when there is no live human in the loop.
 */
export async function fetchActiveProForConversation(conversationId) {
  if (!conversationId) return null;
  let res;
  try {
    res = await ProRequestsApiService.list('mine');
  } catch (_) {
    return null;
  }
  if (!res?.success || !Array.isArray(res.items)) return null;

  const matches = res.items.filter(
    (r) => r?.status === 'active' && r?.context?.conversationId === String(conversationId)
  );
  if (!matches.length) return null;

  // Most recently updated active request wins (one conversation can only have
  // one live pro at a time in practice).
  matches.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  const req = matches[0];

  const proMessages = (req.messages || [])
    .filter((m) => m.authorRole === 'pro' && (m.body || '').trim())
    .map((m) => ({
      type: 'pro',
      content: m.body,
      author: m.authorName || req.assignedProName || 'Професионалец',
      timestamp: new Date(m.createdAt),
      messageId: m._id,
    }));

  return {
    id: req._id,
    assignedProName: req.assignedProName || null,
    // Pro's public profile — always visible/reachable to the user.
    proProfile: {
      name: req.assignedProName || null,
      email: req.assignedProEmail || null,
      city: req.assignedProCity || null,
      address: req.assignedProAddress || null,
      website: req.assignedProWebsite || null,
      phone: req.assignedProPhone || null,
      license: req.assignedProLicense || null,
    },
    userRevealed: !!req.userRevealed,
    proMessages,
  };
}

/**
 * Merge AI/user turns with pro turns into a single timeline, stable-sorted by
 * time, so pro bubbles land in chronological position. No-op when there are no
 * pro messages (keeps the original array identity for cheap renders).
 */
export function mergeProMessages(convMessages = [], proMessages = []) {
  if (!proMessages || !proMessages.length) return convMessages;
  const toTime = (m) => {
    const t = m.timestamp ? new Date(m.timestamp).getTime() : 0;
    return Number.isNaN(t) ? 0 : t;
  };
  return [...convMessages, ...proMessages].sort((a, b) => toTime(a) - toTime(b));
}

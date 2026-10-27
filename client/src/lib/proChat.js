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
 * Find the pro request linked to this conversation — invited and waiting on the
 * board (`open`) or claimed (`active`) — with its
 * human thread normalized to the chat message shape: pro turns as { type: 'pro' }
 * and the user's own turns as { type: 'user', role: 'user' } (both chat surfaces
 * read one or the other). While a pro is active the user's messages go ONLY to
 * this thread (no AI call, no credits), so the thread is their source of truth.
 * From the invite on, the AI stays silent unless the user invites it for a reply.
 * `proProfile` is null while the invite is still waiting (`status: 'open'`).
 * Returns null when there is no human in the loop.
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
    (r) => (r?.status === 'active' || r?.status === 'open') && r?.context?.conversationId === String(conversationId)
  );
  if (!matches.length) return null;

  // A claimed (active) request beats a waiting one; then the most recently updated.
  matches.sort((a, b) => (b.status === 'active') - (a.status === 'active')
    || new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  const req = matches[0];

  const proMessages = (req.messages || [])
    .filter((m) => (m.authorRole === 'pro' || m.authorRole === 'user') && (m.body || '').trim())
    .map((m) => toThreadMessage(m, req.assignedProName));

  return {
    id: req._id,
    status: req.status,
    assignedProName: req.assignedProName || null,
    // Pro's public profile — always visible/reachable to the user (once claimed).
    proProfile: req.status !== 'active' ? null : {
      name: req.assignedProName || null,
      email: req.assignedProEmail || null,
      city: req.assignedProCity || null,
      address: req.assignedProAddress || null,
      website: req.assignedProWebsite || null,
      phone: req.assignedProPhone || null,
      license: req.assignedProLicense || null,
    },
    userRevealed: !!req.userRevealed,
    emailMuted: !!req.emailMuted?.user, // the user's own email opt-out for this conversation
    proMessages,
  };
}

/**
 * Normalize one pro_requests thread message (as returned by the API, e.g. the
 * `message` of an addMessage response) to the chat timeline shape.
 */
export function toThreadMessage(m, assignedProName = null) {
  const isPro = m.authorRole === 'pro';
  return {
    type: isPro ? 'pro' : 'user',
    role: isPro ? 'pro' : 'user',
    content: m.body,
    author: isPro ? (m.authorName || assignedProName || 'Професионалец') : null,
    timestamp: new Date(m.createdAt),
    messageId: m._id,
    fromProThread: true,
  };
}

/**
 * Merge AI/user turns with the human thread into a single timeline, stable-sorted
 * by time, so thread bubbles land in chronological position. No-op when there
 * are no thread messages (keeps the original array identity for cheap renders).
 * A thread user turn whose text already exists as a conversation user turn is
 * dropped — older messages were mirrored into both stores.
 */
export function mergeProMessages(convMessages = [], proMessages = []) {
  if (!proMessages || !proMessages.length) return convMessages;
  const convUserTexts = new Set(
    convMessages
      .filter((m) => (m.type || m.role) === 'user')
      .map((m) => (m.content || '').trim())
  );
  proMessages = proMessages.filter(
    (m) => m.type === 'pro' || !convUserTexts.has((m.content || '').trim())
  );
  const toTime = (m) => {
    const t = m.timestamp ? new Date(m.timestamp).getTime() : 0;
    return Number.isNaN(t) ? 0 : t;
  };
  return [...convMessages, ...proMessages].sort((a, b) => toTime(a) - toTime(b));
}

/**
 * Group chat (user + AI character + human pro): once a pro is invited, the AI only
 * answers when the user invites it for one reply — the „Покани … за коментар"
 * link (AiInviteLink) or typing „@ai" (also @аи / @<character name>).
 */
export function mentionsAi(text, agentName = '') {
  const names = ['ai', 'аи', 'ај', String(agentName || '').toLowerCase()]
    .filter(Boolean).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(^|\\s)@(${names.join('|')})(?=$|[\\s,.!?:;])`, 'iu').test(String(text || ''));
}


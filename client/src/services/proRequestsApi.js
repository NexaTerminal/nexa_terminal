import ApiService from './api';

/**
 * ProRequestsApiService — "Ask a Pro" bridge (Queries / Барања).
 * One object, three role-scoped views (mine | assigned | admin).
 */
class ProRequestsApiService {
  static list(view = 'mine', status = null) {
    const q = new URLSearchParams({ view });
    if (status) q.set('status', status);
    return ApiService.get(`/pro-requests?${q.toString()}`);
  }

  static get(id) {
    return ApiService.get(`/pro-requests/${id}`);
  }

  // Open board of eligible, unclaimed requests (Pro).
  static board() {
    return ApiService.get('/pro-requests/board');
  }

  // payload: { type, subject, agent?, context?, consentVersion? }
  static create(payload) {
    return ApiService.post('/pro-requests', payload);
  }

  static addMessage(id, body) {
    return ApiService.post(`/pro-requests/${id}/messages`, { body });
  }

  static addQuote(id, { amount, currency, body }) {
    return ApiService.post(`/pro-requests/${id}/quote`, { amount, currency, body });
  }

  // Pro: claim an open board request (requires liability acknowledgment).
  static claim(id, { acceptLiability, consentVersion } = {}) {
    return ApiService.post(`/pro-requests/${id}/claim`, { acceptLiability, consentVersion });
  }

  // Requester reveals (or re-hides) their identity to the assigned Pro.
  static reveal(id, revealed = true) {
    return ApiService.post(`/pro-requests/${id}/reveal`, { revealed });
  }

  static reject(id, reason) {
    return ApiService.post(`/pro-requests/${id}/reject`, { reason });
  }

  static close(id) {
    return ApiService.post(`/pro-requests/${id}/close`, {});
  }

  // Turn this conversation's step emails off/on for the caller's side.
  static setEmailMuted(id, muted) {
    return ApiService.post(`/pro-requests/${id}/email-prefs`, { muted: !!muted });
  }

  // Pro: active conversations waiting on their reply ({ count, items }).
  static unanswered() {
    return ApiService.get('/pro-requests/unanswered');
  }

  // Requester: conversations with pro replies not seen yet ({ count }).
  static unread() {
    return ApiService.get('/pro-requests/unread');
  }
}

export default ProRequestsApiService;

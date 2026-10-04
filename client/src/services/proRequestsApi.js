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

  // Admin: approve + broadcast to the Pro board (first to claim joins).
  static approveToBoard(id) {
    return ApiService.post(`/pro-requests/${id}/approve-to-board`, {});
  }

  // Pro: claim an open board request (requires liability acknowledgment).
  static claim(id, { acceptLiability, consentVersion } = {}) {
    return ApiService.post(`/pro-requests/${id}/claim`, { acceptLiability, consentVersion });
  }

  static reject(id, reason) {
    return ApiService.post(`/pro-requests/${id}/reject`, { reason });
  }

  static close(id) {
    return ApiService.post(`/pro-requests/${id}/close`, {});
  }
}

export default ProRequestsApiService;

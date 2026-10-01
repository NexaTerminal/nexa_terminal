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

  static approve(id, assignedProId) {
    return ApiService.post(`/pro-requests/${id}/approve`, { assignedProId });
  }

  static reject(id, reason) {
    return ApiService.post(`/pro-requests/${id}/reject`, { reason });
  }

  static close(id) {
    return ApiService.post(`/pro-requests/${id}/close`, {});
  }

  static providers() {
    return ApiService.get('/pro-requests/providers');
  }
}

export default ProRequestsApiService;

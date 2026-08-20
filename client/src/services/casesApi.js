// Thin axios wrapper for the Предмети (cases) endpoints. Mirrors the auth style
// used by the Employees pages (JWT Bearer header; /api proxy in dev).
import axios from 'axios';

const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });
const unwrap = (p) => p.then((r) => r.data);

const casesApi = {
  list: (token, params = {}) => unwrap(axios.get('/api/cases', { ...auth(token), params })),
  get: (token, id) => unwrap(axios.get(`/api/cases/${id}`, auth(token))),
  create: (token, body) => unwrap(axios.post('/api/cases', body, auth(token))),
  update: (token, id, body) => unwrap(axios.put(`/api/cases/${id}`, body, auth(token))),
  remove: (token, id) => unwrap(axios.delete(`/api/cases/${id}`, auth(token))),
  exportXlsx: (token) => unwrap(axios.get('/api/cases/export', { ...auth(token), responseType: 'blob' })),
  setPublic: (token, id, enabled) => unwrap(axios.put(`/api/cases/${id}/public`, { enabled }, auth(token))),

  aiBrief: (token, id, notes) => unwrap(axios.post(`/api/cases/${id}/ai-brief`, { notes }, auth(token))),

  addDeadline: (token, id, body) => unwrap(axios.post(`/api/cases/${id}/deadlines`, body, auth(token))),
  updateDeadline: (token, id, did, body) => unwrap(axios.put(`/api/cases/${id}/deadlines/${did}`, body, auth(token))),
  removeDeadline: (token, id, did) => unwrap(axios.delete(`/api/cases/${id}/deadlines/${did}`, auth(token))),

  addEntry: (token, id, body) => unwrap(axios.post(`/api/cases/${id}/timeline`, body, auth(token))),
  updateEntry: (token, id, eid, body) => unwrap(axios.put(`/api/cases/${id}/timeline/${eid}`, body, auth(token))),
  removeEntry: (token, id, eid) => unwrap(axios.delete(`/api/cases/${id}/timeline/${eid}`, auth(token))),

  // Public status page — no auth.
  getPublic: (token) => unwrap(axios.get(`/api/public/cases/${token}`)),
};

export default casesApi;

// Thin axios wrapper for the „Интервјуа" owner endpoints. JWT Bearer (CSRF-exempt,
// same as character assessments). The public respondent funnel is fetched directly
// from the respondent page and is not part of this owner API.
import axios from 'axios';

const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });
const unwrap = (p) => p.then((r) => r.data);

const interviewApi = {
  list: (token, type) => unwrap(axios.get(`/api/hr-interviews?type=${encodeURIComponent(type)}`, auth(token))),
  get: (token, id) => unwrap(axios.get(`/api/hr-interviews/${id}`, auth(token))),
  create: (token, body) => unwrap(axios.post('/api/hr-interviews', body, auth(token))),
  resend: (token, id, inviteEmail) => unwrap(axios.post(`/api/hr-interviews/${id}/resend`, { inviteEmail }, auth(token))),
  remove: (token, id) => unwrap(axios.delete(`/api/hr-interviews/${id}`, auth(token))),
  suggest: (token, type, role) => unwrap(axios.get(`/api/hr-interviews/suggest?type=${encodeURIComponent(type)}&role=${encodeURIComponent(role || '')}`, auth(token))),
  getTemplate: (token, type) => unwrap(axios.get(`/api/hr-interviews/template?type=${encodeURIComponent(type)}`, auth(token))),
  saveTemplate: (token, type, questions) => unwrap(axios.put('/api/hr-interviews/template', { type, questions }, auth(token))),
};

export default interviewApi;

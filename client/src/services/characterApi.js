// Thin axios wrapper for the „Проценка на карактер" owner endpoints. JWT Bearer
// (CSRF-exempt, same as cases). The public respondent funnel is fetched directly
// from the respondent page and is not part of this owner API.
import axios from 'axios';

const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });
const unwrap = (p) => p.then((r) => r.data);

const characterApi = {
  list: (token) => unwrap(axios.get('/api/character-assessments', auth(token))),
  get: (token, id) => unwrap(axios.get(`/api/character-assessments/${id}`, auth(token))),
  create: (token, body) => unwrap(axios.post('/api/character-assessments', body, auth(token))),
  resend: (token, id, inviteEmail) => unwrap(axios.post(`/api/character-assessments/${id}/resend`, { inviteEmail }, auth(token))),
  remove: (token, id) => unwrap(axios.delete(`/api/character-assessments/${id}`, auth(token))),
};

export default characterApi;

// Thin axios wrapper for „Регистар на набавки" (procurement register). JWT Bearer
// (CSRF-exempt, same posture as cases / character assessments).
import axios from 'axios';

const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });
const unwrap = (p) => p.then((r) => r.data);

const procurementApi = {
  list:   (token) => unwrap(axios.get('/api/procurement', auth(token))),
  create: (token, body) => unwrap(axios.post('/api/procurement', body, auth(token))),
  update: (token, id, body) => unwrap(axios.put(`/api/procurement/${id}`, body, auth(token))),
  remove: (token, id) => unwrap(axios.delete(`/api/procurement/${id}`, auth(token))),

  addOffer:    (token, id, body) => unwrap(axios.post(`/api/procurement/${id}/offers`, body, auth(token))),
  updateOffer: (token, id, offerId, body) => unwrap(axios.put(`/api/procurement/${id}/offers/${offerId}`, body, auth(token))),
  removeOffer: (token, id, offerId) => unwrap(axios.delete(`/api/procurement/${id}/offers/${offerId}`, auth(token))),
};

export default procurementApi;

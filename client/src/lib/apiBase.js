// Same API base as services/api.js — for plain fetch() calls on public pages.
export const API_BASE = process.env.REACT_APP_API_URL || '/api';

// Images uploaded to Nexa are stored as API paths ("/api/public/profile/img/…").
// Resolve them against the API host so they load whether the API is same-origin
// (nexa.mk/api via the Vercel rewrite) or on its own host (local dev, staging).
const API_ORIGIN = /^https?:\/\//.test(API_BASE) ? API_BASE.replace(/\/api\/?$/, '') : '';
export const mediaUrl = (u) => (typeof u === 'string' && u.startsWith('/api/') && API_ORIGIN ? API_ORIGIN + u : u);

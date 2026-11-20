/**
 * Company profile („Мој профил") — the identity layer of the business network.
 *
 * OPTIONAL by design: nothing in the app requires a profile. It lives in
 * `users.publicProfile`, separate from `companyInfo` (legal/verification data
 * used by document generation), and can be prefilled from companyInfo.
 *
 * Images are LINKS (https URLs) — no uploads. Contact data (email, phone, tax
 * no., address) is never exposed; only an optional, user-entered contactEmail.
 *
 * users.publicProfile = {
 *   slug, displayName, headline, avatarUrl, coverUrl, city,
 *   website, links: { linkedin, facebook, instagram }, offers[], lookingFor[],
 *   contactEmail, visibility: 'public',   // profiles are ALWAYS public (user decision, Nov 2026)
 *   foundingNumber?, createdAt, updatedAt
 * }
 */

const { ObjectId } = require('mongodb');
const { generateSlug } = require('../utils/slugify');

const FOUNDING_LIMIT = 100;
const VISIBILITY = ['public'];

const LIMITS = {
  displayName: 80, headline: 120, city: 60,
  url: 500, contactEmail: 120, tag: 60, tags: 5,
};

// Practice-area keys (Pro) → readable offers for the prefill.
const AREA_LABELS = {
  'consumer-legal': 'Потрошувачко право', immigration: 'Имиграција и престој',
  citizenship: 'Државјанство', 'company-registration': 'Регистрација на фирми',
  'ip-law': 'Интелектуална сопственост', 'tax-accounting': 'Данок и сметководство',
  'labor-law': 'Работно право', 'general-legal': 'Општо правно',
  'real-estate': 'Недвижен имот', insurance: 'Осигурување', consulting: 'Консалтинг',
};

const str = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

// https link or '' (adds https:// to bare domains; rejects other schemes).
function cleanUrl(v) {
  let s = str(v, LIMITS.url);
  if (!s) return '';
  if (/^\/\//.test(s)) s = 'https:' + s;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = 'https://' + s;
  try {
    const u = new URL(s);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return '';
    if (u.protocol === 'http:') u.protocol = 'https:';
    return u.toString();
  } catch {
    return '';
  }
}

function cleanTags(v) {
  if (!Array.isArray(v)) return [];
  const out = [];
  for (const t of v) {
    const s = str(t, LIMITS.tag);
    if (s && !out.some((x) => x.toLowerCase() === s.toLowerCase())) out.push(s);
    if (out.length >= LIMITS.tags) break;
  }
  return out;
}

const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/** Validate the editable fields from a request body → { errors, data }. */
function sanitize(body = {}) {
  const errors = [];
  const links = body.links || {};
  const data = {
    displayName: str(body.displayName, LIMITS.displayName),
    headline: str(body.headline, LIMITS.headline),
    avatarUrl: cleanUrl(body.avatarUrl),
    coverUrl: cleanUrl(body.coverUrl),
    city: str(body.city, LIMITS.city),
    website: cleanUrl(body.website),
    links: {
      linkedin: cleanUrl(links.linkedin),
      facebook: cleanUrl(links.facebook),
      instagram: cleanUrl(links.instagram),
    },
    offers: cleanTags(body.offers),
    lookingFor: cleanTags(body.lookingFor),
    contactEmail: str(body.contactEmail, LIMITS.contactEmail),
    visibility: 'public',
  };
  if (!data.displayName) errors.push('Внеси име на профилот.');
  if (data.contactEmail && !isEmail(data.contactEmail)) errors.push('Е-поштата за контакт не е валидна.');
  if (body.avatarUrl && !data.avatarUrl) errors.push('Линкот за лого/слика не е валиден.');
  if (body.coverUrl && !data.coverUrl) errors.push('Линкот за насловна слика не е валиден.');
  return { errors, data };
}

// City best-effort from companyInfo (same rule as the Virtual Fair).
function deriveCity(ci = {}) {
  if (ci.city) return String(ci.city).trim();
  const addr = ci.companyAddress || ci.address || '';
  const parts = String(addr).split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

/** Profile fields suggested from the user's company info (for the prefill). */
function suggestFromCompany(user = {}) {
  const ci = user.companyInfo || {};
  const su = user.superUser || {};
  const offers = (su.practiceAreas || []).map((a) => AREA_LABELS[a]).filter(Boolean).slice(0, LIMITS.tags);
  return {
    displayName: str(ci.companyName, LIMITS.displayName),
    headline: str(ci.mission, LIMITS.headline),
    avatarUrl: cleanUrl(ci.companyLogo || ci.logoUrl || ''),
    city: str(deriveCity(ci), LIMITS.city),
    website: cleanUrl(ci.website || su.website || ''),
    offers,
    contactEmail: str(user.email || user.officialEmail || '', LIMITS.contactEmail),
  };
}

// Completion 0–100 over the fields that make a profile useful to others.
function completion(p) {
  if (!p) return 0;
  const checks = [
    !!p.displayName, !!p.headline, !!p.avatarUrl, !!p.city,
    (p.offers || []).length > 0, (p.lookingFor || []).length > 0,
    !!(p.website || p.links?.linkedin || p.links?.facebook || p.links?.instagram),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

async function uniqueSlug(db, name, userId) {
  const base = generateSlug(name) || `firma-${String(userId).slice(-6)}`;
  let slug = base;
  for (let i = 1; i < 200; i++) {
    const hit = await db.collection('users').findOne(
      { 'publicProfile.slug': slug, _id: { $ne: userId } }, { projection: { _id: 1 } }
    );
    if (!hit) return slug;
    slug = `${base}-${i + 1}`;
  }
  return `${base}-${Date.now()}`;
}

let indexed = false;
function ensureIndex(db) {
  if (indexed) return;
  indexed = true;
  db.collection('users').createIndex(
    { 'publicProfile.slug': 1 },
    { unique: true, partialFilterExpression: { 'publicProfile.slug': { $type: 'string' } } }
  ).catch((e) => console.warn('[profile] index:', e.message));
}

/** Create or update the user's profile. Slug is assigned once and kept stable. */
async function saveProfile(db, userId, data) {
  ensureIndex(db);
  const _id = new ObjectId(String(userId));
  const user = await db.collection('users').findOne({ _id }, { projection: { publicProfile: 1 } });
  const now = new Date();
  const existing = user?.publicProfile;
  const next = { ...data, updatedAt: now };
  if (existing?.slug) {
    next.slug = existing.slug;
    next.createdAt = existing.createdAt || now;
    if (existing.foundingNumber) next.foundingNumber = existing.foundingNumber;
  } else {
    next.slug = await uniqueSlug(db, data.displayName, _id);
    next.createdAt = now;
    // Atomic counter → founding numbers are never reused, even after deletes.
    const r = await db.collection('counters').findOneAndUpdate(
      { _id: 'profileFounding' }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' }
    );
    const n = (r.value || r)?.seq;
    if (n && n <= FOUNDING_LIMIT) next.foundingNumber = n;
  }
  await db.collection('users').updateOne({ _id }, { $set: { publicProfile: next } });
  return next;
}

async function deleteProfile(db, userId) {
  await db.collection('users').updateOne({ _id: new ObjectId(String(userId)) }, { $unset: { publicProfile: '' } });
}

/** Earned badges — computed from real state, never self-declared. */
async function badgesFor(db, user) {
  const out = [];
  if (user.isVerified) out.push({ key: 'verified', label: 'Верификувана фирма' });
  if (user.role === 'admin_user') out.push({ key: 'pro', label: 'Pro' });
  try {
    const b = await db.collection('badges').findOne({
      userId: { $in: [user._id, String(user._id)] }, module: 'employment',
      revoked: { $ne: true }, expiresAt: { $gt: new Date() },
    }, { projection: { token: 1 } });
    if (b) out.push({ key: 'employer', label: 'Проверен работодавач', href: `/badge/${b.token}` });
  } catch { /* badge lookup is best-effort */ }
  if (user.publicProfile?.foundingNumber) {
    out.push({ key: 'founding', label: `Основачки член #${user.publicProfile.foundingNumber}` });
  }
  return out;
}

/** Shape a profile for viewers (no private fields). */
async function toView(db, user, viewerId) {
  const p = user.publicProfile;
  return {
    slug: p.slug,
    displayName: p.displayName,
    headline: p.headline || '',
    avatarUrl: p.avatarUrl || '',
    coverUrl: p.coverUrl || '',
    city: p.city || '',
    website: p.website || '',
    links: p.links || {},
    offers: p.offers || [],
    lookingFor: p.lookingFor || [],
    contactEmail: p.contactEmail || '',
    visibility: 'public',
    memberSince: p.createdAt,
    badges: await badgesFor(db, user),
    isMine: !!viewerId && String(user._id) === String(viewerId),
  };
}

const PROJECTION = { publicProfile: 1, isVerified: 1, role: 1 };

/** Find a profile by slug (all profiles are public; viewerId only sets isMine). */
async function findBySlug(db, slug, { viewerId } = {}) {
  const user = await db.collection('users').findOne({ 'publicProfile.slug': String(slug) }, { projection: PROJECTION });
  if (!user?.publicProfile) return null;
  return toView(db, user, viewerId);
}

/** userId[] → Map(userId → { slug, avatarUrl }) for visible profiles (feed bylines). */
async function bylines(db, userIds = []) {
  const ids = [...new Set(userIds.filter(Boolean).map(String))].filter((id) => ObjectId.isValid(id));
  if (!ids.length) return new Map();
  const users = await db.collection('users').find(
    { _id: { $in: ids.map((id) => new ObjectId(id)) }, 'publicProfile.slug': { $type: 'string' } },
    { projection: { 'publicProfile.slug': 1, 'publicProfile.avatarUrl': 1, 'publicProfile.displayName': 1 } }
  ).toArray();
  return new Map(users.map((u) => [String(u._id), {
    slug: u.publicProfile.slug, avatarUrl: u.publicProfile.avatarUrl || '', displayName: u.publicProfile.displayName || '',
  }]));
}

module.exports = {
  VISIBILITY, LIMITS, sanitize, suggestFromCompany, completion,
  saveProfile, deleteProfile, findBySlug, toView, bylines,
};

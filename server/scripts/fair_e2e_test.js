/* eslint-disable no-console */
/**
 * E2E test for the Virtual Fair feature against the running server (5002).
 * Seeds throwaway users directly in Mongo, mints JWTs ({ id }), exercises every
 * endpoint, then cleans up. Booth-owner email = ADMIN_EMAIL so the one inquiry
 * email lands in the account owner's own inbox, not a random user's.
 */
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const BASE = 'http://localhost:5002';
const SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const OWNER_EMAIL = process.env.ADMIN_EMAIL || 'terminalnexa@gmail.com';
const TAG = 'FAIR_E2E';

const token = (id) => jwt.sign({ id: String(id) }, SECRET, { expiresIn: '1h' });
let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
  cond ? pass++ : fail++;
};

async function api(path, { method = 'GET', tok, body, form } = {}) {
  const headers = {};
  if (tok) headers.Authorization = `Bearer ${tok}`;
  let payload;
  if (form) { payload = form; }
  else if (body) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
  let data = null;
  try { data = await res.json(); } catch { /* non-json */ }
  return { status: res.status, data };
}

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  const users = db.collection('users');
  const booths = db.collection('fair_booths');

  // Clear any orphans from a prior interrupted run.
  await users.deleteMany({ _e2e: TAG });
  await booths.deleteMany({ companyName: { $regex: `^${TAG}` } });

  const now = new Date();
  const future = new Date(Date.now() + 30 * 864e5);

  // ── seed users ────────────────────────────────────────────────────────────
  const ownerDoc = {
    email: `${TAG.toLowerCase()}_owner@example.com`, username: `${TAG}_owner`, role: 'standard_user', isVerified: true,
    companyInfo: { companyName: `${TAG} Owner Co`, address: 'Скопје, ул. Тест 1', email: OWNER_EMAIL },
    subscription: { status: 'active', plan: 'standard', cycle: 'monthly', endsAt: future },
    _e2e: TAG, createdAt: now
  };
  const buyerDoc = {
    email: `${TAG.toLowerCase()}_buyer@example.com`, username: `${TAG}_buyer`, role: 'standard_user', isVerified: true,
    companyInfo: { companyName: `${TAG} Buyer Co`, address: 'Битола', email: `${TAG.toLowerCase()}_buyer@example.com` },
    subscription: { status: 'active', plan: 'standard', cycle: 'monthly', endsAt: future },
    _e2e: TAG, createdAt: now
  };
  const trialDoc = {
    email: `${TAG.toLowerCase()}_trial@example.com`, username: `${TAG}_trial`, role: 'standard_user', isVerified: true,
    companyInfo: { companyName: `${TAG} Trial Co`, address: 'Охрид', email: `${TAG.toLowerCase()}_trial@example.com` },
    subscription: { status: 'trial', endsAt: future },
    _e2e: TAG, createdAt: now
  };
  const adminDoc = {
    email: `${TAG.toLowerCase()}_admin@example.com`, username: `${TAG}_admin`, role: 'admin', isAdmin: true,
    companyInfo: { companyName: `${TAG} Admin`, address: 'Скопје' },
    _e2e: TAG, createdAt: now
  };

  const [oR, bR, tR, aR] = await Promise.all([
    users.insertOne(ownerDoc), users.insertOne(buyerDoc), users.insertOne(trialDoc), users.insertOne(adminDoc)
  ]);
  const ownerT = token(oR.insertedId), buyerT = token(bR.insertedId), trialT = token(tR.insertedId), adminT = token(aR.insertedId);
  console.log(`\nSeeded users. Owner=${oR.insertedId} Buyer=${bR.insertedId} Trial=${tR.insertedId} Admin=${aR.insertedId}\n`);

  let boothId;
  try {
    // 1. auth required
    check('GET /api/fair without token → 401', (await api('/api/fair')).status === 401);

    // 3. trial cannot post → 402
    const trialPut = await api('/api/fair/me', { method: 'PUT', tok: trialT, body: {
      offers: [{ type: 'service', text: 'Trial booth offer text' }]
    }});
    check('PUT /me as trial → 402', trialPut.status === 402, `status=${trialPut.status} code=${trialPut.data?.code}`);

    // 4. invalid payload → 400 (no offers)
    const badPut = await api('/api/fair/me', { method: 'PUT', tok: ownerT, body: { offers: [] }});
    check('PUT /me invalid payload → 400', badPut.status === 400, `status=${badPut.status}`);

    // 4b. invalid contact email → 400
    const badEmail = await api('/api/fair/me', { method: 'PUT', tok: ownerT, body: {
      offers: [{ type: 'service', text: 'valid text here' }], contactEmail: 'not-an-email'
    }});
    check('PUT /me invalid contactEmail → 400', badEmail.status === 400, `status=${badEmail.status}`);

    // 5. owner creates booth → 200 published, denormalized + booth-level fields
    const okPut = await api('/api/fair/me', { method: 'PUT', tok: ownerT, body: {
      offers: [
        { type: 'service', text: 'Регистрација на фирма — брза регистрација на ДОО', whyUs: 'Искуство 10 години' },
        { type: 'product', text: 'Фирмен печат по нарачка' }
      ],
      website: 'www.example.mk',
      contactEmail: OWNER_EMAIL,
      imageUrl: '/uploads/fair/test-cover.png'
    }});
    boothId = okPut.data?.booth?._id;
    check('PUT /me valid → 200 published', okPut.status === 200 && okPut.data?.booth?.status === 'published', `status=${okPut.status}`);
    check('  booth denormalized companyName/city', okPut.data?.booth?.companyName === `${TAG} Owner Co` && okPut.data?.booth?.city === 'Скопје',
      `name=${okPut.data?.booth?.companyName} city=${okPut.data?.booth?.city}`);
    check('  booth kept 2 offers {type,text}', (okPut.data?.booth?.offers || []).length === 2 && okPut.data?.booth?.offers[0]?.text?.length > 0);
    check('  offer whyUs persisted', okPut.data?.booth?.offers[0]?.whyUs === 'Искуство 10 години', `whyUs=${okPut.data?.booth?.offers[0]?.whyUs}`);
    check('  website normalized (https://) + email + image persisted',
      okPut.data?.booth?.website === 'https://www.example.mk' && okPut.data?.booth?.contactEmail === OWNER_EMAIL && okPut.data?.booth?.imageUrl === '/uploads/fair/test-cover.png',
      `web=${okPut.data?.booth?.website} img=${okPut.data?.booth?.imageUrl}`);

    // 6. get my booth
    const mine = await api('/api/fair/me', { tok: ownerT });
    check('GET /me → returns own booth', mine.status === 200 && mine.data?.booth?._id === boothId);

    // 6b. CLOSED state (force via admin) — browse closed, prepare still works
    await api('/api/fair/admin/settings', { method: 'POST', tok: adminT, body: { mode: 'closed' } });
    const closedList = await api('/api/fair', { tok: buyerT });
    check('CLOSED: buyer browse → open:false + empty + opensAt', closedList.data?.open === false && (closedList.data?.items || []).length === 0 && !!closedList.data?.opensAt,
      `open=${closedList.data?.open} count=${closedList.data?.items?.length}`);
    const closedDetail = await api(`/api/fair/${boothId}`, { tok: buyerT });
    check('CLOSED: buyer detail → 403 FAIR_CLOSED', closedDetail.status === 403 && closedDetail.data?.code === 'FAIR_CLOSED', `status=${closedDetail.status}`);
    const adminClosedList = await api('/api/fair', { tok: adminT });
    check('CLOSED: admin browse → still sees booth (preview)', (adminClosedList.data?.items || []).some(b => b._id === boothId));
    const ownerClosedPut = await api('/api/fair/me', { method: 'PUT', tok: ownerT, body: { offers: [{ type: 'service', text: 'Подготовка додека е затворено' }] } });
    check('CLOSED: owner can still edit booth', ownerClosedPut.status === 200, `status=${ownerClosedPut.status}`);
    // restore the full booth (offers + contact fields) used by later assertions
    await api('/api/fair/me', { method: 'PUT', tok: ownerT, body: {
      offers: [
        { type: 'service', text: 'Регистрација на фирма — брза регистрација на ДОО', whyUs: 'Искуство 10 години' },
        { type: 'product', text: 'Фирмен печат по нарачка' }
      ],
      website: 'www.example.mk', contactEmail: OWNER_EMAIL, imageUrl: '/uploads/fair/test-cover.png'
    } });

    // 6c. force OPEN for the remaining browse/detail assertions
    await api('/api/fair/admin/settings', { method: 'POST', tok: adminT, body: { mode: 'open' } });

    // 7. buyer browses → booth visible
    const list = await api('/api/fair', { tok: buyerT });
    check('GET /api/fair (buyer) → booth in list', list.status === 200 && (list.data?.items || []).some(b => b._id === boothId),
      `count=${list.data?.items?.length}`);

    // 8. type filter + search
    const svc = await api('/api/fair?type=service', { tok: buyerT });
    check('GET /api/fair?type=service → includes booth', (svc.data?.items || []).some(b => b._id === boothId));
    const prod = await api('/api/fair?type=product', { tok: buyerT });
    check('GET /api/fair?type=product → includes booth (has product)', (prod.data?.items || []).some(b => b._id === boothId));
    const searchHit = await api(`/api/fair?search=${encodeURIComponent('печат')}`, { tok: buyerT });
    check('GET /api/fair?search=печат → includes booth', (searchHit.data?.items || []).some(b => b._id === boothId));
    const searchMiss = await api('/api/fair?search=zzznomatchzzz', { tok: buyerT });
    check('GET /api/fair?search=zzznomatchzzz → excludes booth', !(searchMiss.data?.items || []).some(b => b._id === boothId));

    // 9. detail exposes contact fields (direct contact, no inquiry endpoint)
    const detail = await api(`/api/fair/${boothId}`, { tok: buyerT });
    check('GET /api/fair/:id → 200 with website + contactEmail', detail.status === 200 && detail.data?.booth?.website === 'https://www.example.mk' && detail.data?.booth?.contactEmail === OWNER_EMAIL,
      `web=${detail.data?.booth?.website}`);

    // 10. no inquiry endpoint, no admin moderation endpoints (decoupled from email/approval)
    const inqGone = await api(`/api/fair/${boothId}/inquiry`, { method: 'POST', tok: buyerT, body: { message: 'should not exist at all' } });
    check('POST /:id/inquiry → gone (404/403, no longer processed)', inqGone.status === 404 || inqGone.status === 403, `status=${inqGone.status}`);
    const modGone = await api('/api/fair/admin/all', { tok: adminT });
    check('GET /admin/all → 404 (moderation removed)', modGone.status === 404, `status=${modGone.status}`);

    // 11. re-save stays published (no hidden/approval concept)
    const reSave = await api('/api/fair/me', { method: 'PUT', tok: ownerT, body: {
      offers: [{ type: 'service', text: 'Updated offer text here' }]
    }});
    check('owner re-save → still published', reSave.status === 200 && reSave.data?.booth?.status === 'published',
      `status=${reSave.data?.booth?.status}`);

    // 14. auto schedule — today (not last week of quarter) → closed
    await api('/api/fair/admin/settings', { method: 'POST', tok: adminT, body: { mode: 'auto', windowDays: 7, customOpensAt: '', customClosesAt: '' } });
    const autoStatus = await api('/api/fair', { tok: buyerT });
    check('AUTO: today is not last week of quarter → open:false + opensAt', autoStatus.data?.open === false && !!autoStatus.data?.opensAt,
      `open=${autoStatus.data?.open} opensAt=${autoStatus.data?.opensAt}`);

  } catch (e) {
    console.error('TEST ERROR:', e);
    fail++;
  } finally {
    // ── cleanup ───────────────────────────────────────────────────────────
    await booths.deleteMany({ companyName: { $regex: `^${TAG}` } });
    if (boothId) await booths.deleteOne({ _id: new ObjectId(boothId) });
    await users.deleteMany({ _e2e: TAG });
    // Restore default schedule (pure auto) — never leave the fair forced open/closed.
    await db.collection('fair_settings').deleteOne({ _id: 'fair' });
    console.log('\n🧹 Cleaned up test users + booths + reset fair schedule to auto.');
    await client.close();
    console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
    process.exit(fail ? 1 : 0);
  }
})();

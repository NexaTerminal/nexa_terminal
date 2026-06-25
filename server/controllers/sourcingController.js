const { ObjectId } = require('mongodb');
const { effectiveTier } = require('../services/tierService');
const emailService = require('../services/emailService'); // singleton instance

/**
 * Sourcing / RFQ ("Барање за понуди") — manual brokering intake.
 *
 * A verified company posts a need (product/service). We store it and email
 * info@nexa.mk with the full details. Brokering is manual.
 *
 * Monthly quotas by tier (calendar month):
 *   Basic (A) → 1 ново барање + 1 измена
 *   Pro (B)   → 3 нови барања + 3 измени; ADMIN → неограничено.
 */

const COLLECTION = 'sourcing_requests';
const INFO_EMAIL = process.env.SOURCING_EMAIL || 'info@nexa.mk';

const TYPES = ['product', 'service'];
const DISCLOSURE = ['full', 'context', 'anonymous'];
const DISCLOSURE_MK = { full: 'Целосно (име на фирмата)', context: 'Само дејност и регион', anonymous: 'Анонимно (ништо)' };
const TYPE_MK = { product: 'Производ', service: 'Услуга' };

const QUOTAS = {
  A: { requests: 1, edits: 1 },
  B: { requests: 3, edits: 3 },
  C: { requests: 3, edits: 3 }
};
function quotaFor(user) {
  const t = effectiveTier(user);
  if (t === 'ADMIN') return { requests: Infinity, edits: Infinity };
  return QUOTAS[t] || { requests: 0, edits: 0 };
}
function monthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function uid(user) {
  const id = user._id || user.id;
  return id instanceof ObjectId ? id : new ObjectId(String(id));
}

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Count this month's created requests + edits for a user. */
async function usageThisMonth(db, userId) {
  const ms = monthStart();
  const docs = await db.collection(COLLECTION)
    .find({ userId }, { projection: { createdAt: 1, edits: 1 } }).toArray();
  let requestsUsed = 0;
  let editsUsed = 0;
  for (const d of docs) {
    if (d.createdAt && new Date(d.createdAt) >= ms) requestsUsed += 1;
    (d.edits || []).forEach((e) => { if (e.at && new Date(e.at) >= ms) editsUsed += 1; });
  }
  return { requestsUsed, editsUsed };
}

function validate(b) {
  const type = TYPES.includes(b.type) ? b.type : null;
  const category = (b.category || '').toString().trim();
  const description = (b.description || '').toString().trim();
  const region = (b.region || '').toString().trim();
  const budget = (b.budget || '').toString().trim();
  const waitDays = parseInt(b.waitDays, 10);
  const disclosure = DISCLOSURE.includes(b.disclosure) ? b.disclosure : null;
  if (!type) return { error: 'Изберете тип (производ/услуга).' };
  if (!category) return { error: 'Изберете категорија.' };
  if (description.length < 10) return { error: 'Внесете подетален опис (најмалку 10 знаци).' };
  if (!(waitDays >= 1 && waitDays <= 60)) return { error: 'Изберете рок (денови).' };
  if (!disclosure) return { error: 'Изберете колку да прикажеме за Вас.' };
  return { value: { type, category, description, region, budget, waitDays, disclosure } };
}

function companyOf(user) {
  const ci = user.companyInfo || {};
  return {
    companyName: ci.companyName || '',
    email: user.email || '',
    taxNumber: ci.companyTaxNumber || ci.taxNumber || '',
    address: ci.companyAddress || ci.address || '',
    manager: ci.companyManager || ci.manager || ''
  };
}

async function emailAdmin(v, company, id, isEdit) {
  const html = `
    <h2>${isEdit ? 'Изменето барање за понуди' : 'Ново барање за понуди'}</h2>
    <p><strong>Тип:</strong> ${esc(TYPE_MK[v.type])}<br/>
    <strong>Категорија:</strong> ${esc(v.category)}<br/>
    <strong>Рок:</strong> ${v.waitDays} дена<br/>
    <strong>Откривање:</strong> ${esc(DISCLOSURE_MK[v.disclosure])}</p>
    <p><strong>Опис:</strong><br/>${esc(v.description).replace(/\n/g, '<br/>')}</p>
    ${v.region ? `<p><strong>Регион:</strong> ${esc(v.region)}</p>` : ''}
    ${v.budget ? `<p><strong>Буџет/количина:</strong> ${esc(v.budget)}</p>` : ''}
    <hr/><h3>Барател (внатрешно)</h3>
    <p><strong>Фирма:</strong> ${esc(company.companyName) || '—'} · <strong>Е-пошта:</strong> ${esc(company.email) || '—'} · <strong>ЕДБ:</strong> ${esc(company.taxNumber) || '—'}</p>
    <p style="color:#888">ID: ${id}</p>`;
  await emailService.sendEmail(INFO_EMAIL, `${isEdit ? 'Изменето' : 'Ново'} барање за понуди — ${v.category}`, html);
}

// POST /api/sourcing — create
exports.createRequest = async (req, res) => {
  try {
    const { value, error } = validate(req.body || {});
    if (error) return res.status(400).json({ success: false, message: error });

    const db = req.app.locals.db;
    const user = req.user;
    const quota = quotaFor(user);
    const { requestsUsed } = await usageThisMonth(db, uid(user));
    if (requestsUsed >= quota.requests) {
      return res.status(403).json({
        success: false, code: 'QUOTA_REQUESTS',
        message: quota.requests === 0
          ? 'Барање за понуди е достапно за Про членови.'
          : `Ја искористивте месечната квота за барања (${quota.requests}). Обновата е на почетокот на наредниот месец.`
      });
    }

    const company = companyOf(user);
    const doc = { userId: uid(user), company, ...value, status: 'new', edits: [], createdAt: new Date() };
    const { insertedId } = await db.collection(COLLECTION).insertOne(doc);

    try {
      await emailAdmin(value, company, insertedId, false);
      if (company.email) {
        await emailService.sendEmail(company.email, 'Nexa — Вашето барање за понуди е примено',
          `<h2>Вашето барање е примено</h2><p>Ќе се обидеме да обезбедиме понуди и ќе Ве известиме во рок од <strong>${value.waitDays} дена</strong>. Ова е барање, не нарачка — не гарантираме понуди.</p>`);
      }
    } catch (e) { console.error('[sourcing] email failed:', e.message); }

    return res.json({ success: true, id: insertedId.toString(), waitDays: value.waitDays });
  } catch (err) {
    console.error('[sourcing] create error:', err.message);
    return res.status(500).json({ success: false, message: 'Грешка при поднесување.' });
  }
};

// PUT /api/sourcing/:id — edit (owner only, edit-quota gated)
exports.editRequest = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Невалиден ID.' });
    const { value, error } = validate(req.body || {});
    if (error) return res.status(400).json({ success: false, message: error });

    const db = req.app.locals.db;
    const user = req.user;
    const _id = new ObjectId(req.params.id);
    const existing = await db.collection(COLLECTION).findOne({ _id });
    if (!existing) return res.status(404).json({ success: false, message: 'Барањето не е пронајдено.' });
    if (String(existing.userId) !== String(uid(user))) return res.status(403).json({ success: false, message: 'Немате пристап.' });

    const quota = quotaFor(user);
    const { editsUsed } = await usageThisMonth(db, uid(user));
    if (editsUsed >= quota.edits) {
      return res.status(403).json({
        success: false, code: 'QUOTA_EDITS',
        message: quota.edits === 0
          ? 'Измена на барања е достапна за Про членови.'
          : `Ја искористивте месечната квота за измени (${quota.edits}).`
      });
    }

    await db.collection(COLLECTION).updateOne(
      { _id },
      { $set: { ...value, updatedAt: new Date() }, $push: { edits: { at: new Date() } } }
    );

    try { await emailAdmin(value, existing.company, _id, true); }
    catch (e) { console.error('[sourcing] edit email failed:', e.message); }

    return res.json({ success: true });
  } catch (err) {
    console.error('[sourcing] edit error:', err.message);
    return res.status(500).json({ success: false, message: 'Грешка при измена.' });
  }
};

// GET /api/sourcing/me — my requests + monthly usage/quota
exports.myRequests = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const user = req.user;
    const items = await db.collection(COLLECTION)
      .find({ userId: uid(user) }).sort({ createdAt: -1 }).limit(50).toArray();
    const quota = quotaFor(user);
    const usage = await usageThisMonth(db, uid(user));
    return res.json({
      success: true,
      items: items.map((i) => ({
        _id: i._id, type: i.type, category: i.category, description: i.description,
        region: i.region, budget: i.budget, waitDays: i.waitDays, disclosure: i.disclosure,
        status: i.status, createdAt: i.createdAt, updatedAt: i.updatedAt
      })),
      quota: { requests: quota.requests === Infinity ? null : quota.requests, edits: quota.edits === Infinity ? null : quota.edits },
      usage
    });
  } catch (err) {
    console.error('[sourcing] myRequests error:', err.message);
    return res.status(500).json({ success: false, message: 'Грешка при вчитување.' });
  }
};

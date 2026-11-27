// „Понуда" — owner HTTP layer (mounted under /api/sales/quotes, JWT + subscriptionGuard).
// Ownership is enforced in SalesQuotesService by scoping every query to req.user._id.

const { ObjectId } = require('mongodb');
const OpenAI = require('openai');
const aiModels = require('../config/aiModels');

const svc = (req) => req.app.locals.salesQuotesService;
const badId = (id) => !ObjectId.isValid(id);
const fail = (res, code, message) => res.status(code).json({ success: false, message });

const SEND_ERRORS = {
  not_found: [404, 'Понудата не е пронајдена.'],
  no_items: [400, 'Додадете барем една ставка пред да ја испратите понудата.'],
  no_client: [400, 'Внесете го клиентот (име на фирма или лице).'],
};

async function list(req, res) {
  try {
    const data = await svc(req).list(req.user._id, { dealId: req.query.dealId });
    res.json({ success: true, data });
  } catch (e) {
    console.error('[quotes] list:', e);
    fail(res, 500, 'Грешка при вчитување на понудите.');
  }
}

async function get(req, res) {
  try {
    if (badId(req.params.id)) return fail(res, 400, 'Невалиден идентификатор.');
    const [quote, issuer] = await Promise.all([
      svc(req).get(req.user._id, req.params.id),
      svc(req).issuerFor(req.user._id),
    ]);
    if (!quote) return fail(res, 404, 'Понудата не е пронајдена.');
    res.json({ success: true, data: quote, issuer });
  } catch (e) {
    console.error('[quotes] get:', e);
    fail(res, 500, 'Грешка при вчитување на понудата.');
  }
}

async function create(req, res) {
  try {
    const doc = await svc(req).create(req.user._id, req.body || {});
    res.status(201).json({ success: true, data: doc });
  } catch (e) {
    console.error('[quotes] create:', e);
    fail(res, 500, 'Грешка при креирање на понудата.');
  }
}

async function update(req, res) {
  try {
    if (badId(req.params.id)) return fail(res, 400, 'Невалиден идентификатор.');
    const doc = await svc(req).update(req.user._id, req.params.id, req.body || {});
    if (!doc) return fail(res, 409, 'Понудата е веќе одговорена од клиентот — направете нова верзија.');
    res.json({ success: true, data: doc });
  } catch (e) {
    console.error('[quotes] update:', e);
    fail(res, 500, 'Грешка при зачувување на понудата.');
  }
}

async function send(req, res) {
  try {
    if (badId(req.params.id)) return fail(res, 400, 'Невалиден идентификатор.');
    const before = await svc(req).get(req.user._id, req.params.id);
    const r = await svc(req).send(req.user._id, req.params.id);
    if (r.error) { const [code, msg] = SEND_ERRORS[r.error]; return fail(res, code, msg); }
    if (before?.status === 'draft' && before.postOwnerId) notifyPostOwner(req, r.quote).catch(() => {});
    res.json({ success: true, data: r.quote });
  } catch (e) {
    console.error('[quotes] send:', e);
    fail(res, 500, 'Грешка при испраќање на понудата.');
  }
}

/** A quote that answers a „Бараме" post: bell + e-mail to the posting company with the link. */
async function notifyPostOwner(req, q) {
  const db = req.app.locals.db;
  const notifications = require('../services/userNotificationService');
  const emailService = require('../services/emailService');
  const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const link = `https://nexa.mk/ponuda/${q.token}`;
  const from = q.issuer?.name || 'Фирма на Nexa';
  notifications.notify(db, q.postOwnerId, {
    type: 'company_post', title: '📄 Нова понуда за Вашата објава',
    message: `${from} · ${q.title || q.number}`.slice(0, 200), actionUrl: `/ponuda/${q.token}`,
  }, req.app.locals.io).catch(() => {});
  const owner = await db.collection('users').findOne({ _id: q.postOwnerId }, { projection: { email: 1, publicProfile: 1 } });
  const to = owner?.publicProfile?.contactEmail || owner?.email;
  if (!to) return;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;color:#1f2937">
      <h2 style="color:#0B1220;margin:0 0 12px">📄 Нова понуда за Вашата објава</h2>
      <p style="margin:0 0 14px;color:#475569"><strong>${esc(from)}</strong> Ви испрати понуда за „${esc(q.title || '')}".</p>
      <p style="margin:18px 0"><a href="${link}" style="background:#15803d;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px">Погледнете ја понудата</a></p>
      <p style="font-size:13px;color:#64748b">Понудата ја прифаќате или поставувате прашање директно на линкот.</p>
    </div>`;
  emailService.sendEmail(to, `Нова понуда: ${q.title || q.number} — ${from}`, html, q.issuer?.email ? { replyTo: q.issuer.email } : {})
    .catch((e) => console.warn('[quotes] post-owner email failed:', e.message));
}

async function duplicate(req, res) {
  try {
    if (badId(req.params.id)) return fail(res, 400, 'Невалиден идентификатор.');
    const doc = await svc(req).duplicate(req.user._id, req.params.id);
    if (!doc) return fail(res, 404, 'Понудата не е пронајдена.');
    res.status(201).json({ success: true, data: doc });
  } catch (e) {
    console.error('[quotes] duplicate:', e);
    fail(res, 500, 'Грешка при копирање на понудата.');
  }
}

async function remove(req, res) {
  try {
    if (badId(req.params.id)) return fail(res, 400, 'Невалиден идентификатор.');
    const ok = await svc(req).remove(req.user._id, req.params.id);
    if (!ok) return fail(res, 404, 'Понудата не е пронајдена.');
    res.json({ success: true });
  } catch (e) {
    console.error('[quotes] remove:', e);
    fail(res, 500, 'Грешка при бришење на понудата.');
  }
}

// ── Миа: intro paragraph / follow-up message ────────────────────────────────

let _openai = null;
const openai = () => (_openai ||= new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));

const fmtMoney = (n, cur) => `${Number(n || 0).toLocaleString('de-DE', { maximumFractionDigits: 2 })} ${cur === 'EUR' ? '€' : 'ден.'}`;

const MIA_SYSTEM =
  'Ти си Миа, маркетинг соработничка во Nexa. Пишуваш на чист македонски стандарден јазик, ' +
  'со учтиво обраќање Вие (секогаш со голема буква: Вие, Ве, Вас, Ви, Ваш), топло но деловно, без претерување и без емоџи. ' +
  'Пишуваш во име на фирмата во прво лице множина (ние, нашите производи), никогаш за фирмата во трето лице. ' +
  'Никогаш не измислувај цени, рокови, гаранции, референци или факти што ги нема во податоците. ' +
  'Не користи наслови, листи, наводници околу целиот текст ниту потпис со измислено име. ' +
  'Врати го САМО текстот.';

function quoteFacts(q, issuer) {
  const items = (q.items || []).slice(0, 12).map((it) => `- ${it.name}${it.description ? ` (${it.description})` : ''}: ${it.qty} ${it.unit}`).join('\n');
  return [
    `Фирма што ја праќа понудата: ${issuer?.name || 'нашата фирма'}`,
    `Клиент: ${q.client?.name || ''}${q.client?.person ? `, лице за контакт ${q.client.person}` : ''}`,
    q.title ? `Предмет на понудата: ${q.title}` : '',
    `Ставки:\n${items || '- (нема ставки)'}`,
    `Вкупно со ДДВ: ${fmtMoney(q.totals?.total, q.currency)}`,
    q.discountPct ? `Попуст: ${q.discountPct}%` : '',
    q.validUntil ? `Важи до: ${new Date(q.validUntil).toLocaleDateString('mk-MK')}` : '',
    `Број: ${q.number}`,
  ].filter(Boolean).join('\n');
}

// Formal address in a business letter: Ве / Вас / Ви / Ваш… always capitalised.
function formalPronouns(t) {
  return t.replace(/(^|[^\p{L}])(ве|вас|ви|ваш|ваша|вашиот|вашата|вашето|вашите|ваши|вашего)(?=[^\p{L}]|$)/gu,
    (m, pre, w) => pre + w.charAt(0).toUpperCase() + w.slice(1))
    .replace(/Ве благодар/g, 'Ви благодар'); // dative: „Ви благодариме"
}

async function aiText(req, res) {
  try {
    if (badId(req.params.id)) return fail(res, 400, 'Невалиден идентификатор.');
    if (!process.env.OPENAI_API_KEY) return fail(res, 503, 'AI текстот моментално не е достапен.');
    const kind = req.body?.kind === 'followup' ? 'followup' : 'intro';
    const [q, issuer] = await Promise.all([
      svc(req).get(req.user._id, req.params.id),
      svc(req).issuerFor(req.user._id),
    ]);
    if (!q) return fail(res, 404, 'Понудата не е пронајдена.');

    const task = kind === 'intro'
      ? 'Напиши краток воведен пасус за оваа понуда (2–3 реченици, најмногу 60 збора): заблагодари за интересот, ' +
        'кажи што нудиме со зборови на корист за клиентот и покани на одговор преку копчињата на понудата. ' +
        'Без поздрав „Почитувани" на почеток и без потпис — тие се веќе на понудата.'
      : 'Напиши кратка порака за потсетување до клиентот (најмногу 70 збора) што може да се прати по е-пошта или Viber: ' +
        'учтиво потсети на понудата и бројот, спомни до кога важи, понуди да одговориш на прашања и замоли за краток одговор. ' +
        'Започни со „Почитувани" (или со името на лицето за контакт ако е дадено) и заврши со „Со почит," и името на фирмата. ' +
        'Не притискај и не измислувај попусти.';

    const resp = await openai().chat.completions.create(aiModels.completionParams({
      model: aiModels.OPENAI_UTILITY_MODEL,
      max_tokens: 2500,
      messages: [
        { role: 'system', content: MIA_SYSTEM },
        { role: 'user', content: `${task}\n\nПОДАТОЦИ:\n${quoteFacts(q, issuer)}` },
      ],
    }, { effort: 'low' }));
    const text = formalPronouns(String(resp?.choices?.[0]?.message?.content || '').trim().replace(/^["„]|["“]$/g, '')).slice(0, 1500);
    if (!text) return fail(res, 502, 'Миа не успеа да напише текст. Обидете се повторно.');
    res.json({ success: true, data: { kind, text } });
  } catch (e) {
    console.error('[quotes] aiText:', e.message);
    fail(res, 500, 'Грешка при пишување на текстот.');
  }
}

module.exports = { list, get, create, update, send, duplicate, remove, aiText };

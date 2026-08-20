/**
 * Cases controller — legal matter management (Pro/lawyer feature).
 * Gated to tier B (Pro) or ADMIN; every authenticated op is scoped to req.user._id.
 * The public status endpoint (getPublic) takes no auth and returns a redacted view.
 */
const OpenAI = require('openai');
const XLSX = require('xlsx');
const CasesService = require('../services/casesService');
const tierService = require('../services/tierService');

// MK labels for human-readable export (mirror client/src/config/cases.js).
const CASE_TYPE_LABEL = { parnica: 'Парница', krivicno: 'Кривично', upravna: 'Управна постапка', dogovorno: 'Договорно', nasledstvo: 'Наследство', rabotni: 'Работни односи', izvrsuvanje: 'Извршување', registracija: 'Регистрација', drugo: 'Друго' };
const STATUS_LABEL = { open: 'Отворен', in_progress: 'Во тек', waiting: 'На чекање', closed: 'Затворен', archived: 'Архивиран' };
const PRIORITY_LABEL = { low: 'Низок', normal: 'Нормален', high: 'Висок' };
const DEADLINE_TYPE_LABEL = { rociste: 'Рочиште', zalba: 'Жалба', podnesok: 'Поднесок', zastarenost: 'Застареност', plakanje: 'Плаќање', drugo: 'Друго' };
const fmtDate = (d) => { if (!d) return ''; const x = new Date(d); if (isNaN(x)) return ''; return `${String(x.getDate()).padStart(2, '0')}.${String(x.getMonth() + 1).padStart(2, '0')}.${x.getFullYear()}`; };

const AI_MODEL = process.env.CASE_BRIEF_MODEL || 'gpt-4o-mini';
let _openai = null;
const openai = () => {
  if (!_openai && process.env.OPENAI_API_KEY) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
};

const make = (req) => new CasesService(req.app.locals.db);

const handle = (res, err) => {
  const map = { INVALID_INPUT: 400, INVALID_ID: 400, NOT_FOUND: 404 };
  return res.status(map[err.code] || 500).json({
    success: false, code: err.code || 'ERROR', message: err.message, fields: err.fields
  });
};

// Pro (B) or ADMIN only — mirrors clientsController.requireProOrAdmin.
exports.requireProOrAdmin = (req, res, next) => {
  const v = tierService.visibleTier(req.user);
  if (v === 'B' || v === 'ADMIN') return next();
  return res.status(403).json({ success: false, code: 'TIER_FORBIDDEN',
    message: 'Предметите се достапни само за Про членови.' });
};

// ── Case CRUD ────────────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const items = await make(req).list(req.user._id, { search: req.query.search, status: req.query.status });
    return res.json({ success: true, items });
  } catch (err) { return handle(res, err); }
};

exports.create = async (req, res) => {
  try {
    const item = await make(req).create(req.user._id, req.body || {});
    return res.status(201).json({ success: true, item });
  } catch (err) { return handle(res, err); }
};

exports.get = async (req, res) => {
  try {
    const item = await make(req).getOwned(req.user._id, req.params.id);
    if (!item) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    return res.json({ success: true, item });
  } catch (err) { return handle(res, err); }
};

exports.update = async (req, res) => {
  try {
    const item = await make(req).update(req.user._id, req.params.id, req.body || {});
    return res.json({ success: true, item });
  } catch (err) { return handle(res, err); }
};

exports.remove = async (req, res) => {
  try {
    const result = await make(req).remove(req.user._id, req.params.id);
    return res.json({ success: true, ...result });
  } catch (err) { return handle(res, err); }
};

exports.setPublic = async (req, res) => {
  try {
    const item = await make(req).setPublicEnabled(req.user._id, req.params.id, req.body?.enabled);
    return res.json({ success: true, item });
  } catch (err) { return handle(res, err); }
};

// ── Deadlines ─────────────────────────────────────────────────────────────────
exports.addDeadline = async (req, res) => {
  try { return res.json({ success: true, item: await make(req).addDeadline(req.user._id, req.params.id, req.body || {}) }); }
  catch (err) { return handle(res, err); }
};
exports.updateDeadline = async (req, res) => {
  try { return res.json({ success: true, item: await make(req).updateDeadline(req.user._id, req.params.id, req.params.deadlineId, req.body || {}) }); }
  catch (err) { return handle(res, err); }
};
exports.removeDeadline = async (req, res) => {
  try { return res.json({ success: true, item: await make(req).removeDeadline(req.user._id, req.params.id, req.params.deadlineId) }); }
  catch (err) { return handle(res, err); }
};

// ── Timeline ──────────────────────────────────────────────────────────────────
exports.addEntry = async (req, res) => {
  try { return res.json({ success: true, item: await make(req).addEntry(req.user._id, req.params.id, req.body || {}) }); }
  catch (err) { return handle(res, err); }
};
exports.updateEntry = async (req, res) => {
  try { return res.json({ success: true, item: await make(req).updateEntry(req.user._id, req.params.id, req.params.entryId, req.body || {}) }); }
  catch (err) { return handle(res, err); }
};
exports.removeEntry = async (req, res) => {
  try { return res.json({ success: true, item: await make(req).removeEntry(req.user._id, req.params.id, req.params.entryId) }); }
  catch (err) { return handle(res, err); }
};

// ── Excel export (full report of all the lawyer's cases) ─────────────────────
exports.exportXlsx = async (req, res) => {
  try {
    const cases = await make(req).list(req.user._id, {}); // all cases, owner-scoped

    // Sheet 1 — one row per case.
    const caseRows = cases.map((c) => ({
      'Наслов': c.title || '',
      'Вид': CASE_TYPE_LABEL[c.caseType] || c.caseType || '',
      'Статус': STATUS_LABEL[c.status] || c.status || '',
      'Приоритет': PRIORITY_LABEL[c.priority] || c.priority || '',
      'Клиент': c.clientName || '',
      'Е-пошта на клиент': c.clientEmail || '',
      'Внатрешен број': c.internalNumber || '',
      'Службен број': c.caseNumber || '',
      'Суд / институција': c.courtName || '',
      'Спротивна страна': c.opposingParty || '',
      'Вредност': c.value || '',
      'Отворен': fmtDate(c.openedAt),
      'Следен рок': c.nextDeadline ? `${fmtDate(c.nextDeadline.dueAt)} — ${c.nextDeadline.title}` : '',
      'Активни рокови': (c.deadlines || []).filter((d) => !d.done).length,
      'Активности': (c.timeline || []).length,
      'Јавен линк': `https://leads.nexa.mk/predmet/${c.publicToken}`
    }));

    // Sheet 2 — one row per deadline across all cases.
    const deadlineRows = [];
    cases.forEach((c) => {
      (c.deadlines || []).forEach((d) => {
        deadlineRows.push({
          'Предмет': c.title || '',
          'Рок': d.title || '',
          'Вид': DEADLINE_TYPE_LABEL[d.type] || d.type || '',
          'Датум': fmtDate(d.dueAt),
          'Статус': d.done ? 'Завршено' : 'Активен',
          'Потсетник': d.remind === false ? 'Не' : 'Да',
          'Видлив за клиент': d.clientVisible ? 'Да' : 'Не'
        });
      });
    });

    const wb = XLSX.utils.book_new();
    const wsCases = XLSX.utils.json_to_sheet(caseRows.length ? caseRows : [{ 'Наслов': 'Нема предмети' }]);
    wsCases['!cols'] = [{ wch: 34 }, { wch: 16 }, { wch: 12 }, { wch: 11 }, { wch: 24 }, { wch: 24 }, { wch: 16 }, { wch: 16 }, { wch: 24 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 46 }];
    XLSX.utils.book_append_sheet(wb, wsCases, 'Предмети');

    const wsDeadlines = XLSX.utils.json_to_sheet(deadlineRows.length ? deadlineRows : [{ 'Предмет': 'Нема рокови' }]);
    wsDeadlines['!cols'] = [{ wch: 34 }, { wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsDeadlines, 'Рокови');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const fileName = `predmeti-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  } catch (err) {
    console.error('[cases] export failed:', err.message);
    return res.status(500).json({ success: false, code: 'ERROR', message: 'Грешка при извоз.' });
  }
};

// ── AI brief helper ─────────────────────────────────────────────────────────
// Turns the lawyer's rough notes into a clean internal summary and a short,
// client-friendly version they can drop into a client-visible timeline entry.
const AI_SYSTEM = `Ти си асистент на адвокат од Северна Македонија. Од груби белешки за активност по предмет напиши:
1) "summary" — професионално, концизно резиме на активноста на македонски (2–4 реченици), за интерна евиденција.
2) "clientSummary" — кратко, разбирливо резиме за клиентот на македонски (1–3 реченици), без правен жаргон и без интерна стратегија.
Не измислувај факти што ги нема во белешките. Врати само JSON: {"summary": "...", "clientSummary": "..."}.`;

exports.aiBrief = async (req, res) => {
  try {
    // Ensure the case belongs to the caller before spending an AI call.
    const owned = await make(req).getOwned(req.user._id, req.params.id);
    if (!owned) return res.status(404).json({ success: false, code: 'NOT_FOUND' });

    const notes = String(req.body?.notes || '').trim().slice(0, 4000);
    if (!notes) return res.status(400).json({ success: false, code: 'INVALID_INPUT', message: 'Внесете белешки.' });

    const client = openai();
    if (!client) {
      // No key configured (e.g. dev) — degrade gracefully to the raw notes.
      return res.json({ success: true, summary: notes, clientSummary: notes, degraded: true });
    }

    const response = await client.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: AI_SYSTEM },
        { role: 'user', content: `БЕЛЕШКИ:\n${notes}` }
      ]
    });
    const raw = response?.choices?.[0]?.message?.content || '{}';
    let parsed = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    return res.json({
      success: true,
      summary: String(parsed.summary || notes).trim(),
      clientSummary: String(parsed.clientSummary || '').trim()
    });
  } catch (err) {
    console.error('[cases] aiBrief failed:', err.message);
    // Fail-soft — return the notes so the lawyer is never blocked.
    return res.json({ success: true, summary: String(req.body?.notes || '').trim(), clientSummary: '', degraded: true });
  }
};

// ── Public status page (no auth) ──────────────────────────────────────────────
exports.getPublic = async (req, res) => {
  try {
    const data = await make(req).getPublicByToken(req.params.token);
    if (!data) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    return res.json({ success: true, case: data });
  } catch (err) { return handle(res, err); }
};

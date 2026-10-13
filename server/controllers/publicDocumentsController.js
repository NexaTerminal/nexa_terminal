/**
 * Public document generation via a shared link (no auth).
 *
 * A stranger opens a Pro user's share link, fills the form, and generates the .docx.
 * The token (stateless, signed) names the owner + document + optional client party.
 * Generation is charged to the OWNER's credits; the visitor pays nothing and we store
 * nothing. Reuses the exact same template + validation as the authenticated flow.
 */

const { Packer } = require('docx');
const { ObjectId } = require('mongodb');
const shareService = require('../services/documentShareService');
const { getGenerator } = require('../utils/documentGenerators');
const { resolveCompanyForDocument, generateFilename } = require('../utils/baseDocumentController');

const loadOwner = async (db, ownerId) => {
  try { return await db.collection('users').findOne({ _id: new ObjectId(ownerId) }); }
  catch (_) { return null; }
};

// GET /api/public/documents/:token — render metadata for the public form.
exports.getMeta = async (req, res) => {
  let payload;
  try { payload = shareService.verify(req.params.token); }
  catch (e) { return res.status(400).json({ success: false, message: e.message || 'Невалиден линк.' }); }

  if (!getGenerator(payload.apiEndpoint)) {
    return res.status(404).json({ success: false, message: 'Документот не е достапен за споделување.' });
  }

  let ownerName = '';
  try {
    const owner = await loadOwner(req.app.locals.db, payload.ownerId);
    ownerName = owner?.companyInfo?.companyName || owner?.name || '';
  } catch (_) { /* branding is best-effort */ }

  return res.json({
    success: true,
    apiEndpoint: payload.apiEndpoint,
    documentType: payload.documentType || payload.apiEndpoint,
    ownerName,
    prefill: payload.prefill || {},
    locked: Array.isArray(payload.locked) ? payload.locked : [],
    expiresAt: payload.exp ? payload.exp * 1000 : null
  });
};

// POST /api/public/documents/:token/generate — generate + stream the .docx.
exports.generate = async (req, res) => {
  let payload;
  try { payload = shareService.verify(req.params.token); }
  catch (e) { return res.status(400).json({ success: false, message: e.message || 'Невалиден линк.' }); }

  const gen = getGenerator(payload.apiEndpoint);
  if (!gen) return res.status(404).json({ success: false, message: 'Документот не е достапен за споделување.' });

  const db = req.app.locals.db;
  const creditService = req.app.locals.creditService;

  const owner = await loadOwner(db, payload.ownerId);
  if (!owner) return res.status(403).json({ success: false, message: 'Сопственикот на линкот не е пронајден.' });

  // The owner pays — verify up front so the stranger isn't stopped mid-form for nothing.
  try {
    const ok = creditService && await creditService.checkBalance(owner._id, 1);
    if (!ok) return res.status(402).json({ success: false, code: 'OWNER_NO_CREDITS',
      message: 'Сопственикот на линкот нема доволно кредити за генерирање. Контактирајте го.' });
  } catch (e) {
    console.error('[public-documents] credit check failed:', e.message);
    return res.status(500).json({ success: false, message: 'Грешка при проверка на кредитите.' });
  }

  // Prefill (defaults) + visitor input; then FORCE locked fields from the prefill so a
  // visitor can't override what the owner fixed (even if the client UI allowed editing).
  const prefill = payload.prefill && typeof payload.prefill === 'object' ? payload.prefill : {};
  const locked = Array.isArray(payload.locked) ? payload.locked : [];
  const visitor = (req.body && req.body.formData) ? req.body.formData : {};
  const formData = { ...prefill, ...visitor };
  for (const k of locked) { if (Object.prototype.hasOwnProperty.call(prefill, k)) formData[k] = prefill[k]; }
  if (payload.clientId) formData.clientId = payload.clientId;

  try {
    const company = await resolveCompanyForDocument(req, formData, owner, gen.documentName);

    // Same (non-blocking by convention) validation as the authed path.
    let warnings = [];
    if (typeof gen.validateFunction === 'function') {
      const v = gen.validateFunction(formData, owner, company);
      if (v && v.isValid === false) {
        return res.status(400).json({ success: false, message: v.message || 'Валидацијата не помина', missingFields: v.missing });
      }
      if (v && Array.isArray(v.warnings)) warnings = v.warnings;
    }

    const processed = typeof gen.preprocessFunction === 'function' ? gen.preprocessFunction(formData, owner, company) : formData;
    const result = gen.templateFunction(processed, owner, company);
    const doc = result && (result.doc || result);
    if (!doc) throw new Error('Template returned nothing');

    const buffer = await Packer.toBuffer(doc);
    if (!buffer || !buffer.length) throw new Error('Empty document buffer');

    // Charge AFTER a successful build (failed attempts never cost the owner a credit).
    try {
      await creditService.deductCredits(owner._id, 1, 'DOCUMENT_GENERATION', { via: 'public-share', apiEndpoint: payload.apiEndpoint });
    } catch (e) {
      console.error('[public-documents] deduct failed (serving doc anyway):', e.message);
    }

    const filename = generateFilename(gen.documentName, processed);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Length', buffer.length);
    if (warnings.length) res.setHeader('X-Generation-Warnings', JSON.stringify(warnings));
    return res.send(buffer);
  } catch (e) {
    console.error('[public-documents] generation failed:', e);
    return res.status(500).json({ success: false, message: 'Грешка при генерирање на документот.' });
  }
};

/**
 * Document share links controller (Pro/lawyer feature).
 *
 * A Pro user mints a public, short-lived link for a specific automated document;
 * anyone with the link fills the form and generates the .docx (charged to this Pro's
 * credits). Stateless signed token — nothing is stored. Gated to tier B (Pro)/ADMIN.
 */

const tierService = require('../services/tierService');
const shareService = require('../services/documentShareService');
const { isShareable, listShareable } = require('../utils/documentGenerators');

// Pro (B) or ADMIN only — mirrors clientsController.requireProOrAdmin.
exports.requireProOrAdmin = (req, res, next) => {
  const v = tierService.visibleTier(req.user);
  if (v === 'B' || v === 'ADMIN') return next();
  return res.status(403).json({ success: false, code: 'TIER_FORBIDDEN',
    message: 'Споделувањето на документи е достапно само за Про членови.' });
};

// GET /api/document-links/shareable — which documents can be shared.
exports.shareable = (req, res) => {
  return res.json({ success: true, endpoints: listShareable() });
};

// Keep only scalar, non-internal, non-empty values — bounds token/URL size and
// avoids leaking control keys. Prefill is a convenience for the visitor; locked
// fields are additionally forced server-side at generation time.
const cleanPrefill = (obj) => {
  const out = {};
  if (!obj || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj)) {
    if (!k || k.startsWith('_') || k === 'acceptTerms' || k === 'clientId') continue;
    if (v == null) continue;
    const t = typeof v;
    if (t === 'string') { if (v.trim()) out[k] = v; }
    else if (t === 'number' || t === 'boolean') out[k] = v;
    // arrays/objects skipped (keeps the signed link short)
  }
  return out;
};

// POST /api/document-links — mint a public link for one document.
// Body: { apiEndpoint, documentType?, clientId?, prefill?, locked? }
exports.create = async (req, res) => {
  try {
    const { apiEndpoint, documentType, clientId, prefill, locked } = req.body || {};
    if (!apiEndpoint || !isShareable(apiEndpoint)) {
      return res.status(400).json({ success: false, code: 'NOT_SHAREABLE',
        message: 'Овој документ сè уште не е достапен за споделување.' });
    }

    const cleanedPrefill = cleanPrefill(prefill);
    const lockedList = Array.isArray(locked)
      ? locked.filter((k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(cleanedPrefill, k))
      : [];
    // Bound the signed token so the URL stays usable.
    if (JSON.stringify(cleanedPrefill).length > 2500) {
      return res.status(400).json({ success: false, code: 'PREFILL_TOO_LARGE',
        message: 'Премногу однапред пополнети податоци за еден линк. Намалете ги пополнетите полиња.' });
    }

    // If a client was chosen, make sure the caller owns it (reuse the clients service).
    if (clientId) {
      try {
        const ClientsService = require('../services/clientsService');
        const owned = await new ClientsService(req.app.locals.db).getOwned(req.user._id, clientId);
        if (!owned) {
          return res.status(400).json({ success: false, code: 'CLIENT_NOT_FOUND',
            message: 'Избраниот клиент не е пронајден.' });
        }
      } catch (e) {
        console.warn('[document-links] client ownership check failed:', e.message);
      }
    }

    const token = shareService.sign({
      ownerId: String(req.user._id),
      apiEndpoint,
      documentType: documentType || apiEndpoint,
      ...(clientId ? { clientId: String(clientId) } : {}),
      ...(Object.keys(cleanedPrefill).length ? { prefill: cleanedPrefill } : {}),
      ...(lockedList.length ? { locked: lockedList } : {})
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const url = `${frontendUrl}/dokument/${token}`;
    const ttlMin = shareService.ttlMinutes();

    return res.status(201).json({
      success: true,
      url,
      token,
      expiresInMinutes: ttlMin,
      expiresAt: new Date(Date.now() + ttlMin * 60 * 1000)
    });
  } catch (err) {
    console.error('[document-links] create failed:', err);
    return res.status(500).json({ success: false, code: 'ERROR', message: 'Грешка при креирање на линкот.' });
  }
};

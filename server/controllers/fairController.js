/**
 * Виртуелен саем (Virtual Fair) controller.
 *
 * One booth per company (keyed by userId). Browsing open to all logged-in
 * users; writing gated upstream by requireBoothPoster (active paid plans).
 * Booth identity fields (company name, city, logo) are denormalized from
 * req.user.companyInfo on every save so the fair stays in sync with the profile.
 * Each offer is minimal: { type: 'product'|'service', text }.
 */

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { ObjectId } = require('mongodb');
const { COLLECTION, OFFER_TYPES, validateBooth } = require('../config/fairSchemas');
const { getFairStatus, VALID_MODES } = require('../services/fairScheduleService');

const SETTINGS_COLLECTION = 'fair_settings';
const SETTINGS_ID = 'fair';

// Load the single fair settings doc (or {} default → auto schedule).
async function loadSettings(db) {
  return (await db.collection(SETTINGS_COLLECTION).findOne({ _id: SETTINGS_ID })) || {};
}

// City best-effort: explicit city field, else first comma-segment of address.
function deriveCity(companyInfo = {}) {
  if (companyInfo.city) return String(companyInfo.city).trim();
  const addr = companyInfo.companyAddress || companyInfo.address || '';
  return addr.split(',')[0]?.trim() || '';
}

function deriveLogo(companyInfo = {}) {
  return companyInfo.logoUrl || companyInfo.companyLogo || '';
}

// Public projection — never leak owner contact details into list/detail payloads.
const PUBLIC_FIELDS = {
  companyName: 1, city: 1, logoUrl: 1, offers: 1, status: 1, publishedAt: 1, userId: 1,
  website: 1, contactEmail: 1, imageUrl: 1
};

class FairController {
  constructor() {
    this.upload = multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'public/uploads/fair'),
        filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
        cb(ok ? null : new Error('Дозволени се само JPEG, PNG и WebP слики.'), ok);
      }
    });

    this.listPublished = this.listPublished.bind(this);
    this.getMyBooth = this.getMyBooth.bind(this);
    this.upsertMyBooth = this.upsertMyBooth.bind(this);
    this.uploadImage = this.uploadImage.bind(this);
    this.getById = this.getById.bind(this);
    this.adminGetSettings = this.adminGetSettings.bind(this);
    this.adminSaveSettings = this.adminSaveSettings.bind(this);
  }

  // GET /api/fair — published booths, filterable by offer type + free-text search.
  // The fair is only browsable during its open window (last week of the quarter,
  // or per admin override). When closed, non-admins get an empty list + the
  // next opening time; admins still see booths so they can preview the lineup.
  async listPublished(req, res) {
    try {
      const db = req.app.locals.db;
      const status = getFairStatus(await loadSettings(db));
      const isAdminUser = req.user.role === 'admin' || req.user.isAdmin === true;

      if (!status.open && !isAdminUser) {
        return res.json({
          success: true, open: false, opensAt: status.opensAt, closesAt: status.closesAt,
          items: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0 }
        });
      }

      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 24));
      const skip = (page - 1) * limit;

      const query = { status: 'published' };
      if (OFFER_TYPES.includes(req.query.type)) {
        query['offers.type'] = req.query.type;
      }
      const search = (req.query.search || '').trim();
      if (search) {
        const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.$or = [{ companyName: rx }, { 'offers.text': rx }];
      }

      const col = db.collection(COLLECTION);
      const [items, total] = await Promise.all([
        col.find(query, { projection: PUBLIC_FIELDS })
          .sort({ publishedAt: -1 }).skip(skip).limit(limit).toArray(),
        col.countDocuments(query)
      ]);

      res.json({
        success: true,
        open: status.open,
        opensAt: status.opensAt,
        closesAt: status.closesAt,
        items,
        pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total }
      });
    } catch (err) {
      console.error('[fair] listPublished error:', err);
      res.status(500).json({ success: false, message: 'Грешка при вчитување на саемот' });
    }
  }

  // GET /api/fair/me — the caller's own booth (any status), or null.
  async getMyBooth(req, res) {
    try {
      const db = req.app.locals.db;
      const booth = await db.collection(COLLECTION).findOne({ userId: new ObjectId(req.user._id) });
      res.json({ success: true, booth: booth || null });
    } catch (err) {
      console.error('[fair] getMyBooth error:', err);
      res.status(500).json({ success: false, message: 'Грешка при вчитување на штандот' });
    }
  }

  // PUT /api/fair/me — create or update the caller's booth (auto-published).
  async upsertMyBooth(req, res) {
    try {
      const db = req.app.locals.db;
      const companyInfo = req.user.companyInfo || {};

      if (!companyInfo.companyName) {
        return res.status(400).json({
          success: false,
          message: 'Комплетирајте го профилот на компанијата пред да поставите штанд.'
        });
      }

      const { errors, data } = validateBooth(req.body);
      if (errors.length) {
        return res.status(400).json({ success: false, message: errors.join(', '), errors });
      }

      const col = db.collection(COLLECTION);
      const userId = new ObjectId(req.user._id);
      const now = new Date();
      const existing = await col.findOne({ userId });

      const doc = {
        userId,
        companyName: companyInfo.companyName,
        city: deriveCity(companyInfo),
        logoUrl: deriveLogo(companyInfo),
        offers: data.offers,
        website: data.website,
        contactEmail: data.contactEmail,
        imageUrl: data.imageUrl,
        status: 'published',
        updatedAt: now
      };

      if (existing) {
        await col.updateOne({ _id: existing._id }, { $set: doc });
      } else {
        doc.createdAt = now;
        doc.publishedAt = now;
        await col.insertOne(doc);
      }

      const booth = await col.findOne({ userId });
      res.json({ success: true, booth });
    } catch (err) {
      console.error('[fair] upsertMyBooth error:', err);
      res.status(500).json({ success: false, message: 'Грешка при зачувување на штандот' });
    }
  }

  // POST /api/fair/me/image — upload one image, returns its public URL.
  // (Kept for future use; current minimal UI does not surface image upload.)
  async uploadImage(req, res) {
    if (!req.file) return res.status(400).json({ success: false, message: 'Нема прикачена слика' });
    res.json({ success: true, url: `/uploads/fair/${req.file.filename}` });
  }

  // GET /api/fair/:id — single published booth (or owner viewing own).
  async getById(req, res) {
    try {
      const db = req.app.locals.db;
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Невалиден ID' });
      }
      const booth = await db.collection(COLLECTION).findOne(
        { _id: new ObjectId(req.params.id) },
        { projection: PUBLIC_FIELDS }
      );
      if (!booth) return res.status(404).json({ success: false, message: 'Штандот не е пронајден' });

      // Outside the open window only the owner/admin may view a booth.
      const isOwner = String(booth.userId) === String(req.user._id);
      const isAdminUser = req.user.role === 'admin' || req.user.isAdmin === true;
      const fair = getFairStatus(await loadSettings(db));
      if (!fair.open && !isOwner && !isAdminUser) {
        return res.status(403).json({ success: false, code: 'FAIR_CLOSED', message: 'Саемот е затворен.', opensAt: fair.opensAt });
      }
      res.json({ success: true, booth });
    } catch (err) {
      console.error('[fair] getById error:', err);
      res.status(500).json({ success: false, message: 'Грешка при вчитување на штандот' });
    }
  }

  // GET /api/fair/admin/settings — schedule settings + computed status.
  async adminGetSettings(req, res) {
    try {
      const db = req.app.locals.db;
      const settings = await loadSettings(db);
      const status = getFairStatus(settings);
      res.json({
        success: true,
        settings: {
          mode: settings.mode || 'manual',
          windowDays: settings.windowDays || 7,
          customOpensAt: settings.customOpensAt || null,
          customClosesAt: settings.customClosesAt || null
        },
        status
      });
    } catch (err) {
      console.error('[fair] adminGetSettings error:', err);
      res.status(500).json({ success: false, message: 'Грешка при вчитување' });
    }
  }

  // POST /api/fair/admin/settings — update schedule.
  // body: { mode, windowDays, customOpensAt, customClosesAt }
  async adminSaveSettings(req, res) {
    try {
      const db = req.app.locals.db;
      const { mode, windowDays, customOpensAt, customClosesAt } = req.body || {};
      if (mode && !VALID_MODES.includes(mode)) {
        return res.status(400).json({ success: false, message: 'Невалиден режим' });
      }
      const set = { updatedAt: new Date() };
      if (mode) set.mode = mode;
      if (windowDays != null) {
        const n = parseInt(windowDays, 10);
        if (!(n >= 1 && n <= 90)) return res.status(400).json({ success: false, message: 'Денови: 1–90' });
        set.windowDays = n;
      }
      // Empty string clears a custom date; a value sets it.
      if (customOpensAt !== undefined) set.customOpensAt = customOpensAt ? new Date(customOpensAt) : null;
      if (customClosesAt !== undefined) set.customClosesAt = customClosesAt ? new Date(customClosesAt) : null;

      await db.collection(SETTINGS_COLLECTION).updateOne(
        { _id: SETTINGS_ID }, { $set: set }, { upsert: true }
      );
      const settings = await loadSettings(db);
      res.json({ success: true, settings, status: getFairStatus(settings) });
    } catch (err) {
      console.error('[fair] adminSaveSettings error:', err);
      res.status(500).json({ success: false, message: 'Грешка при зачувување' });
    }
  }
}

module.exports = new FairController();

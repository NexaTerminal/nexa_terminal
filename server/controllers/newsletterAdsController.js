/**
 * Controllers for newsletter banner-slot bookings.
 *
 * Member endpoints: availability / mine / book.
 * Admin endpoints: list by month / cancel.
 *
 * Gating: routes apply authenticateJWT + subscriptionGuard (any ACTIVE
 * subscriber — Basic or Pro — may book; trial/suspended get 402 from the
 * guard) + blockSubSeats. This is intentionally NOT the Pro-only gate used
 * by blog submissions.
 */

const fs = require('fs');
const path = require('path');
const NewsletterAdsService = require('../services/newsletterAdsService');
const emailTemplates = require('../emails/newsletterAdEmails');

const UPLOAD_DIR = 'public/uploads/newsletter-ads';

const makeService = (req) => new NewsletterAdsService(req.app.locals.db);

const handleErr = (res, err, defaultStatus = 500) => {
  const codeMap = {
    INVALID_USER:       400,
    INVALID_ID:         400,
    INVALID_MONTH:      400,
    INVALID_URL:        400,
    IMAGE_REQUIRED:     400,
    INVALID_TRANSITION: 400,
    TIER_FORBIDDEN:     403,
    NOT_FOUND:          404,
    QUOTA_EXCEEDED:     409,
    MONTH_FULL:         409
  };
  const status = codeMap[err.code] || defaultStatus;
  return res.status(status).json({ success: false, code: err.code || 'ERROR', message: err.message });
};

// ── member endpoints ────────────────────────────────────────────────────────

exports.availability = async (req, res) => {
  try {
    const months = await makeService(req).listAvailability();
    return res.json({ success: true, months });
  } catch (err) { return handleErr(res, err); }
};

exports.mine = async (req, res) => {
  try {
    const result = await makeService(req).listMine(req.user);
    return res.json({ success: true, ...result });
  } catch (err) { return handleErr(res, err); }
};

exports.book = async (req, res) => {
  try {
    if (!req.file) {
      const e = new Error('Прикачете слика за банерот (JPG или PNG).');
      e.code = 'IMAGE_REQUIRED';
      throw e;
    }

    let targetUrl = String(req.body?.targetUrl || '').trim().slice(0, 500);
    if (targetUrl && !/^https?:\/\//i.test(targetUrl)) {
      fs.unlink(path.join(UPLOAD_DIR, req.file.filename), () => {});
      const e = new Error('Линкот мора да почнува со http:// или https://');
      e.code = 'INVALID_URL';
      throw e;
    }

    const doc = await makeService(req).book(req.user, {
      monthKey: String(req.body?.monthKey || '').trim(),
      imageUrl: `/uploads/newsletter-ads/${req.file.filename}`,
      imageFilename: req.file.filename,
      targetUrl: targetUrl || null,
      note: req.body?.note
    });

    // Fire-and-forget admin notification with the banner attached. The booking
    // is already committed — an email failure only logs a warning; the admin
    // bookings page remains the source of truth.
    (async () => {
      try {
        const svc = req.app.locals.emailService;
        if (!svc?.sendEmail) return;
        const adminEmail = process.env.NEWSLETTER_ADS_EMAIL || 'info@nexa.mk';
        const buf = await fs.promises.readFile(path.join(UPLOAD_DIR, doc.imageFilename));
        const t = emailTemplates.newsletterAdBookedAdmin(doc);
        await svc.sendEmail(adminEmail, t.subject, t.html, {
          attachments: [{ filename: doc.imageFilename, content: buf }]
        });
      } catch (e) {
        console.warn('[newsletter-ads] admin email failed:', e.message);
      }
    })();

    return res.status(201).json({ success: true, booking: doc });
  } catch (err) { return handleErr(res, err); }
};

// ── admin endpoints ─────────────────────────────────────────────────────────

exports.adminList = async (req, res) => {
  try {
    const items = await makeService(req).adminListByMonth(req.query.month);
    return res.json({ success: true, items });
  } catch (err) { return handleErr(res, err); }
};

exports.adminCancel = async (req, res) => {
  try {
    const doc = await makeService(req).adminCancel(req.params.id);
    // Courtesy email to the member (fire-and-forget).
    (async () => {
      try {
        const svc = req.app.locals.emailService;
        if (!svc?.sendEmail || !doc.userEmail) return;
        const t = emailTemplates.newsletterAdCancelledUser({
          name: doc.companyName,
          monthKey: doc.monthKey
        });
        await svc.sendEmail(doc.userEmail, t.subject, t.html);
      } catch (e) {
        console.warn('[newsletter-ads] cancel email failed:', e.message);
      }
    })();
    return res.json({ success: true, booking: doc });
  } catch (err) { return handleErr(res, err); }
};

// ── middleware ──────────────────────────────────────────────────────────────

// Sub-seats work under a parent company account; the banner belongs to the
// company, so only the owner account may book.
exports.blockSubSeats = (req, res, next) => {
  if (req.user?.role === 'sub_seat') {
    return res.status(403).json({ success: false, code: 'TIER_FORBIDDEN',
      message: 'Резервацијата на банер е достапна само за сопственикот на сметката.' });
  }
  return next();
};

exports.requireAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ success: false, code: 'NOT_ADMIN', message: 'Admin only.' });
};

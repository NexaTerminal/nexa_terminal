/**
 * routes/adminBackup.js — admin-only, on-demand database backup download.
 *
 *   GET /api/admin/backup  ->  streams a .zip (EJSON per collection) to the browser.
 *
 * This is the "fire up backup" button for the admin UI. The same backup core is
 * used by `npm run backup` (scripts/backup.js). Pure-Node so it works in prod
 * where the mongodump binary is absent.
 *
 * The dump contains PII (EMBG, company data) — hence the strict authenticateJWT
 * + isAdmin gate. Anything that loosens this gate is a data-exfiltration risk.
 */

const express = require('express');
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const { streamBackup, backupFilename } = require('../services/backupService');

const router = express.Router();
router.use(authenticateJWT);
router.use(isAdmin);

router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(503).json({ message: 'Database not available' });
  }

  const filename = backupFilename();
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  // No length header: the zip is streamed, so let the transfer be chunked.

  try {
    const stats = await streamBackup(db, res);
    console.log(
      `[backup] admin ${req.user?.email || req.user?._id} downloaded ${filename} — ` +
        `${stats.collections} collections, ${stats.documents} docs, ${(stats.bytes / 1024 / 1024).toFixed(2)} MB`
    );
  } catch (err) {
    console.error('[backup] download failed:', err.message);
    // Headers are likely already sent once streaming started; only send a JSON
    // error if we still can. Otherwise the client sees a truncated zip + the
    // server log records the failure.
    if (!res.headersSent) res.status(500).json({ message: 'Backup failed' });
    else res.destroy(err);
  }
});

// POST /api/admin/backup/run-now — trigger the scheduled (Phase 2) backup
// immediately: dump → upload to Google Drive → prune → email notice. Useful for
// verifying Drive config without waiting for the weekly cron.
router.post('/run-now', async (req, res) => {
  const scheduler = req.app.locals.backupScheduler;
  if (!scheduler) {
    return res.status(503).json({ message: 'Backup scheduler not initialized' });
  }
  const result = await scheduler.runNow(req.app.locals.db);
  return res.status(result.ok ? 200 : 500).json(result);
});

module.exports = router;

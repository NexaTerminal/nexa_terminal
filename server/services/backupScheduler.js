'use strict';

const cron = require('node-cron');
const fs = require('fs');
const os = require('os');
const path = require('path');

const cfg = require('../config/backupConfig');
const { streamBackup, backupFilename } = require('./backupService');
const drive = require('./googleDriveService');

/**
 * Scheduled off-site backup (Phase 2). On each tick it:
 *   1. dumps every collection to a temp .zip (same core as `npm run backup`),
 *   2. uploads it to the configured Google Drive folder,
 *   3. prunes to the newest RETENTION copies,
 *   4. emails a success/failure notice,
 *   5. always deletes the temp file.
 *
 * Mirrors TrialReminderScheduler's shape (start/tick/runNow/stop). Inert unless
 * cfg.ENABLED and Drive is configured, so an unconfigured deploy never errors.
 */
class BackupScheduler {
  /** @param {{ sendEmail: Function }} emailService */
  constructor(emailService) {
    this.emailService = emailService;
    this.job = null;
  }

  start() {
    if (!cfg.ENABLED) {
      console.log('[BackupScheduler] disabled (BACKUP_SCHEDULE_ENABLED!=true)');
      return;
    }
    if (!cfg.isDriveConfigured()) {
      console.warn('[BackupScheduler] enabled but Google Drive not configured — not scheduling');
      return;
    }
    if (!cron.validate(cfg.CRON)) {
      console.error(`[BackupScheduler] invalid BACKUP_CRON "${cfg.CRON}" — not scheduling`);
      return;
    }
    this.job = cron.schedule(cfg.CRON, () => this.tick(), { scheduled: true, timezone: cfg.TIMEZONE });
    console.log(`[BackupScheduler] ⏰ scheduled "${cfg.CRON}" (${cfg.TIMEZONE}), keep ${cfg.RETENTION}`);
  }

  /** Run one backup→upload→prune cycle. `db` defaults to app.locals via caller. */
  async tick(db) {
    const database = db || this._db;
    if (!database) {
      console.error('[BackupScheduler] no db handle — skipping');
      return { ok: false, error: 'no db handle' };
    }

    const filename = backupFilename();
    const tmpPath = path.join(os.tmpdir(), filename);
    const started = Date.now();

    try {
      // 1) dump to temp file
      const stats = await streamBackup(database, fs.createWriteStream(tmpPath));

      // 2) upload
      const uploaded = await drive.uploadFile(tmpPath, filename);

      // 3) prune
      const pruned = await drive.pruneOldBackups(cfg.RETENTION);

      const secs = ((Date.now() - started) / 1000).toFixed(1);
      const mb = (stats.bytes / 1024 / 1024).toFixed(2);
      const summary = {
        ok: true,
        filename,
        driveFileId: uploaded.id,
        collections: stats.collections,
        documents: stats.documents,
        sizeMB: mb,
        seconds: secs,
        pruned: pruned.deleted,
        kept: pruned.kept,
      };
      console.log('[BackupScheduler] ✅', summary);
      await this._notify(true, summary);
      return summary;
    } catch (err) {
      console.error('[BackupScheduler] ❌ backup failed:', err.message);
      await this._notify(false, { filename, error: err.message });
      return { ok: false, error: err.message };
    } finally {
      fs.promises.unlink(tmpPath).catch(() => {});
    }
  }

  /** Manual trigger (admin endpoint / testing). */
  async runNow(db) {
    return this.tick(db);
  }

  /** Stash the db handle so the cron tick (which gets no args) can use it. */
  setDb(db) {
    this._db = db;
    return this;
  }

  stop() {
    if (this.job) { this.job.stop(); this.job = null; }
  }

  async _notify(success, info) {
    if (!this.emailService || typeof this.emailService.sendEmail !== 'function') return;
    try {
      const subject = success
        ? `✅ Nexa backup OK — ${info.filename}`
        : `❌ Nexa backup FAILED — ${info.filename}`;
      const rows = Object.entries(info)
        .map(([k, v]) => `<tr><td style="padding:2px 10px 2px 0;color:#666">${k}</td><td>${v}</td></tr>`)
        .join('');
      const html =
        `<h2 style="margin:0 0 8px">${success ? 'Backup succeeded' : 'Backup failed'}</h2>` +
        `<table style="font:14px/1.4 sans-serif">${rows}</table>`;
      await this.emailService.sendEmail(cfg.NOTIFY_EMAIL, subject, html);
    } catch (e) {
      console.warn('[BackupScheduler] notify email failed:', e.message);
    }
  }
}

module.exports = BackupScheduler;

'use strict';

/**
 * Scheduled off-site backup (Phase 2).
 *
 * A cron job runs the same pure-Node EJSON backup as `npm run backup`
 * (services/backupService.js), uploads the .zip to a Google Drive folder, prunes
 * old copies, and emails a success/failure notice.
 *
 * Auth: OAuth2 refresh token for a PERSONAL Gmail account (service accounts get
 * 0 bytes of Drive quota and can't write to a personal My Drive). Mint the token
 * once with `node scripts/google-drive-auth.js`.
 *
 * The whole feature is OFF unless BACKUP_SCHEDULE_ENABLED=true AND the Google
 * credentials below are present — so an unconfigured deploy is a no-op, never an
 * error.
 */
module.exports = Object.freeze({
  // Master switch. Default OFF — opt in explicitly once Drive is configured.
  ENABLED: process.env.BACKUP_SCHEDULE_ENABLED === 'true',

  TIMEZONE: process.env.TZ_MK || 'Europe/Skopje',

  // Cron expression (in TIMEZONE). Default: weekly, Sunday 03:00.
  CRON: process.env.BACKUP_CRON || '0 3 * * 0',

  // How many most-recent backups to keep in the Drive folder. Older ones are
  // deleted after each successful upload.
  RETENTION: parseInt(process.env.BACKUP_RETENTION || '8', 10),

  // Where to email the success/failure notice. Falls back to the platform admin.
  NOTIFY_EMAIL: process.env.BACKUP_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || 'terminalnexa@gmail.com',

  // Google OAuth2 (personal Gmail). All three required to upload.
  GOOGLE: Object.freeze({
    CLIENT_ID: process.env.GOOGLE_DRIVE_CLIENT_ID || '',
    CLIENT_SECRET: process.env.GOOGLE_DRIVE_CLIENT_SECRET || '',
    REFRESH_TOKEN: process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '',
    // Optional: redirect URI used when the token was minted (default matches the
    // installed-app/OOB flow in scripts/google-drive-auth.js).
    REDIRECT_URI: process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:5002/oauth2callback',
    // Target Drive folder id. Empty = upload to My Drive root.
    FOLDER_ID: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
  }),

  /** True only when the three OAuth credentials are all present. */
  isDriveConfigured() {
    const g = this.GOOGLE;
    return !!(g.CLIENT_ID && g.CLIENT_SECRET && g.REFRESH_TOKEN);
  },
});

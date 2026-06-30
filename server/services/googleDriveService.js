'use strict';

/**
 * googleDriveService.js — thin wrapper over the Drive v3 API for backups.
 *
 * Auth is an OAuth2 refresh token for a personal Gmail account (see
 * config/backupConfig.js and scripts/google-drive-auth.js). Scope is
 * `drive.file` (least privilege): the app may create files and manage only the
 * files it created — exactly the backup zips — and nothing else in the Drive.
 *
 * If folder targeting ever fails under drive.file, widen DRIVE_SCOPES to the
 * full `https://www.googleapis.com/auth/drive` scope and re-mint the token.
 */

const fs = require('fs');
const { google } = require('googleapis');
const cfg = require('../config/backupConfig');

// Single source of truth for the consent scope. The auth helper imports this so
// the minted token matches what the uploader requests.
const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.file'];

/** Build an authorized OAuth2 client from the configured credentials. */
function makeOAuth2Client() {
  const g = cfg.GOOGLE;
  const client = new google.auth.OAuth2(g.CLIENT_ID, g.CLIENT_SECRET, g.REDIRECT_URI);
  if (g.REFRESH_TOKEN) client.setCredentials({ refresh_token: g.REFRESH_TOKEN });
  return client;
}

function driveClient() {
  return google.drive({ version: 'v3', auth: makeOAuth2Client() });
}

/**
 * Upload a local file to the configured Drive folder.
 * @returns {Promise<{id:string,name:string,size?:string}>}
 */
async function uploadFile(localPath, filename) {
  const drive = driveClient();
  const requestBody = { name: filename };
  if (cfg.GOOGLE.FOLDER_ID) requestBody.parents = [cfg.GOOGLE.FOLDER_ID];

  const res = await drive.files.create({
    requestBody,
    media: { mimeType: 'application/zip', body: fs.createReadStream(localPath) },
    fields: 'id, name, size',
    // Lets the app upload into a folder living on a Shared Drive too, harmlessly
    // ignored for My Drive.
    supportsAllDrives: true,
  });
  return res.data;
}

/**
 * List backup zips this app created in the target folder, newest first.
 * Only app-created files are visible under the drive.file scope.
 * @returns {Promise<Array<{id:string,name:string,createdTime:string}>>}
 */
async function listBackups() {
  const drive = driveClient();
  const clauses = ["name contains 'nexa-backup-'", 'trashed = false'];
  if (cfg.GOOGLE.FOLDER_ID) clauses.push(`'${cfg.GOOGLE.FOLDER_ID}' in parents`);

  const res = await drive.files.list({
    q: clauses.join(' and '),
    orderBy: 'createdTime desc',
    fields: 'files(id, name, createdTime)',
    pageSize: 100,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return res.data.files || [];
}

async function deleteFile(fileId) {
  const drive = driveClient();
  await drive.files.delete({ fileId, supportsAllDrives: true });
}

/**
 * Keep the `keep` newest backups in the folder; delete the rest.
 * @returns {Promise<{deleted:number, kept:number}>}
 */
async function pruneOldBackups(keep) {
  const files = await listBackups();
  const stale = files.slice(Math.max(0, keep));
  for (const f of stale) {
    try {
      await deleteFile(f.id);
    } catch (e) {
      console.warn(`[backup] could not delete old backup ${f.name}: ${e.message}`);
    }
  }
  return { deleted: stale.length, kept: Math.min(files.length, keep) };
}

module.exports = {
  DRIVE_SCOPES,
  makeOAuth2Client,
  uploadFile,
  listBackups,
  deleteFile,
  pruneOldBackups,
};

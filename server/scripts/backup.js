#!/usr/bin/env node
/**
 * scripts/backup.js — on-demand local backup of the whole Nexa database.
 *
 *   npm run backup                # -> server/backups/nexa-backup-<date>.zip
 *   npm run backup -- --out /path/to/dir
 *
 * Produces a single .zip (EJSON per collection) you can drop into Google Drive.
 * Connects with its own MongoClient so the process exits cleanly when done.
 *
 * Mirrors server.js env loading: NODE_ENV=development reads .env.development,
 * otherwise .env.
 */

const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');

const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env';
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });

const { streamBackup, backupFilename } = require('../services/backupService');

function parseOutDir() {
  const i = process.argv.indexOf('--out');
  if (i !== -1 && process.argv[i + 1]) return path.resolve(process.argv[i + 1]);
  return path.join(__dirname, '..', 'backups');
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('FATAL: MONGODB_URI is not set');
    process.exit(1);
  }

  const outDir = parseOutDir();
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, backupFilename());

  const client = new MongoClient(uri);
  const started = Date.now();
  try {
    await client.connect();
    const db = client.db('nexa');
    console.log(`[backup] connected to "${db.databaseName}" — writing ${outPath}`);

    const dest = fs.createWriteStream(outPath);
    const stats = await streamBackup(db, dest);

    const mb = (stats.bytes / 1024 / 1024).toFixed(2);
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    console.log(
      `[backup] ✅ ${stats.collections} collections, ${stats.documents} documents, ${mb} MB in ${secs}s`
    );
    console.log(`[backup] saved: ${outPath}`);
  } catch (err) {
    console.error('[backup] ❌ failed:', err.message);
    process.exitCode = 1;
  } finally {
    await client.close().catch(() => {});
  }
}

main();

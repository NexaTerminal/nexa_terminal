#!/usr/bin/env node
/**
 * scripts/restore.js — restore a backup made by scripts/backup.js.
 *
 *   npm run restore -- --file backups/nexa-backup-<date>.zip
 *        → restores into the TEST database "nexa_restore_test" (safe default)
 *   npm run restore -- --file <zip> --db nexa --confirm=nexa
 *        → REPLACES the live "nexa" database with the backup (every collection
 *          in the backup is emptied and re-filled; collections not in the
 *          backup are left alone)
 *
 * Counts are checked against the backup's manifest after each collection.
 * Mirrors backup.js env loading (.env, or .env.development when NODE_ENV=development).
 */

const path = require('path');
const fs = require('fs');
const JSZip = require('jszip');
const { EJSON } = require('bson');
const { MongoClient } = require('mongodb');

const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env';
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });

const arg = (name) => {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return null;
  if (hit.includes('=')) return hit.slice(hit.indexOf('=') + 1);
  const next = process.argv[process.argv.indexOf(hit) + 1];
  return next && !next.startsWith('--') ? next : '';
};

async function main() {
  const file = arg('file');
  const dbName = arg('db') || 'nexa_restore_test';
  const confirm = arg('confirm');
  if (!file) throw new Error('Pass --file <backup.zip>');
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  // Overwriting a real database needs the name typed twice (--db X --confirm=X).
  if (dbName !== 'nexa_restore_test' && confirm !== dbName) {
    throw new Error(`Refusing to restore into "${dbName}" without --confirm=${dbName}`);
  }

  const zip = await JSZip.loadAsync(fs.readFileSync(path.resolve(file)));
  const manifest = JSON.parse(await zip.file('_manifest.json').async('string'));
  const expected = manifest.collections || {};
  const entries = Object.keys(zip.files).filter((n) => n.startsWith('collections/') && n.endsWith('.json'));

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(dbName);
  console.log(`[restore] ${entries.length} collections from ${path.basename(file)} → "${dbName}"`);

  let total = 0;
  let mismatches = 0;
  try {
    for (const entry of entries) {
      const name = entry.slice('collections/'.length, -'.json'.length);
      const docs = EJSON.parse(await zip.file(entry).async('string'), { relaxed: false });
      await db.collection(name).deleteMany({});
      if (docs.length) await db.collection(name).insertMany(docs, { ordered: false });
      const count = await db.collection(name).countDocuments();
      const want = typeof expected[name] === 'number' ? expected[name] : (expected[name]?.count ?? docs.length);
      if (count !== want) { mismatches += 1; console.log(`  ⚠️  ${name}: ${count} (expected ${want})`); }
      total += count;
    }
    console.log(`[restore] ${mismatches ? '⚠️' : '✅'} ${total} documents restored, ${mismatches} count mismatch(es)`);
  } finally {
    await client.close();
  }
  if (mismatches) process.exitCode = 1;
}

main().catch((err) => { console.error('[restore] ❌', err.message); process.exit(1); });

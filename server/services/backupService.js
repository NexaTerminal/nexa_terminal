/**
 * backupService.js — pure-Node backup of all MongoDB collections.
 *
 * Why pure-Node (no mongodump): the MongoDB CLI tools are NOT installed on the
 * production hosts (Render/Railway default Node images), so a server-triggered
 * mongodump would fail. Instead we read every collection through the driver we
 * already use and serialize each to Extended JSON (EJSON), which round-trips
 * BSON types (ObjectId, Date, Decimal128, Binary) losslessly. The result is a
 * single .zip that restores anywhere.
 *
 * Used by both triggers:
 *   - scripts/backup.js     (CLI:  npm run backup)        -> writes a dated zip to disk
 *   - routes/adminBackup.js (HTTP: GET /api/admin/backup) -> streams to browser
 *
 * Scale note: each collection is serialized in full before being added to the
 * zip. That is the right trade-off for Nexa's current data size; if any single
 * collection grows into the hundreds of MB, switch to a cursor-streamed entry.
 */

const archiver = require('archiver');
const { EJSON } = require('bson');

/**
 * Build a timestamped backup filename, e.g. nexa-backup-2026-06-28_1430.zip
 */
function backupFilename(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const stamp =
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `_${pad(date.getHours())}${pad(date.getMinutes())}`;
  return `nexa-backup-${stamp}.zip`;
}

/**
 * Stream a full backup of every collection in `db` into `destStream`.
 *
 * The zip is laid out as:
 *   _manifest.json          -> metadata (db name, timestamp, per-collection counts)
 *   collections/<name>.json -> an EJSON array of that collection's documents
 *
 * @param {import('mongodb').Db} db          - connected MongoDB database handle
 * @param {NodeJS.WritableStream} destStream - where the .zip bytes go
 * @param {object} [opts]
 * @param {string[]} [opts.exclude]          - collection names to skip
 * @returns {Promise<{ collections: number, documents: number, bytes: number }>}
 */
async function streamBackup(db, destStream, opts = {}) {
  const exclude = new Set(opts.exclude || []);

  const archive = archiver('zip', { zlib: { level: 9 } });
  const done = new Promise((resolve, reject) => {
    archive.on('error', reject);
    archive.on('warning', (err) => {
      // ENOENT etc. are non-fatal warnings; anything else should fail the backup.
      if (err.code === 'ENOENT') console.warn('[backup] archive warning:', err.message);
      else reject(err);
    });
    destStream.on('error', reject);
    destStream.on('close', resolve);
    destStream.on('finish', resolve);
  });

  archive.pipe(destStream);

  const collections = (await db.listCollections({}, { nameOnly: true }).toArray())
    .map((c) => c.name)
    .filter((name) => !name.startsWith('system.') && !exclude.has(name))
    .sort();

  const manifest = {
    database: db.databaseName,
    createdAt: new Date().toISOString(),
    tool: 'backupService.js (EJSON)',
    collections: {},
  };
  let totalDocs = 0;

  for (const name of collections) {
    const docs = await db.collection(name).find({}).toArray();
    // relaxed:false keeps BSON types explicit so the dump restores losslessly.
    const body = '[\n' + docs.map((d) => EJSON.stringify(d, { relaxed: false })).join(',\n') + '\n]\n';
    archive.append(body, { name: `collections/${name}.json` });

    manifest.collections[name] = docs.length;
    totalDocs += docs.length;
  }

  archive.append(JSON.stringify(manifest, null, 2), { name: '_manifest.json' });

  await archive.finalize();
  await done;

  return {
    collections: collections.length,
    documents: totalDocs,
    bytes: archive.pointer(),
  };
}

module.exports = { streamBackup, backupFilename };

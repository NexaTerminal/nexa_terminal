#!/usr/bin/env node
'use strict';

/**
 * One-time backfill: set `normalizedEmail` on every user that has `email`.
 *
 * Run before adding the unique partial index — surfaces collisions in
 * stdout so an operator can decide which account to keep.
 *
 *   node server/scripts/backfillNormalizedEmail.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const { normalizeEmail } = require('../utils/emailNormalize');

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  const client = new MongoClient(uri);
  await client.connect();
  const dbName = (new URL(uri).pathname || '/nexa').slice(1) || 'nexa';
  const db = client.db(dbName);
  const col = db.collection('users');

  console.log('Scanning users for backfill…');
  const cursor = col.find({ email: { $exists: true, $ne: '' } }, { projection: { _id: 1, email: 1, normalizedEmail: 1, role: 1 } });

  const collisions = new Map(); // normalized → [userId]
  let updated = 0, skipped = 0, total = 0;

  while (await cursor.hasNext()) {
    const u = await cursor.next();
    total++;
    const n = normalizeEmail(u.email);
    if (!n) { skipped++; continue; }

    if (u.normalizedEmail !== n) {
      await col.updateOne({ _id: u._id }, { $set: { normalizedEmail: n } });
      updated++;
    }
    if (!collisions.has(n)) collisions.set(n, []);
    collisions.get(n).push({ id: String(u._id), role: u.role || 'user' });
  }

  console.log(`Scanned ${total} users. Updated ${updated}. Skipped ${skipped}.`);

  // Report collisions (more than one standalone account sharing an email).
  console.log('\nCollisions (>1 standalone account per normalizedEmail):');
  let count = 0;
  for (const [n, owners] of collisions.entries()) {
    const standalone = owners.filter(o => o.role !== 'sub_seat');
    if (standalone.length > 1) {
      count++;
      console.log(`  ${n} →`, standalone.map(o => `${o.id} (${o.role})`).join(', '));
    }
  }
  if (count === 0) console.log('  none');

  console.log('\nDone. Create the partial unique index manually after reviewing collisions:');
  console.log(`  db.users.createIndex(
    { normalizedEmail: 1 },
    { unique: true, partialFilterExpression: { normalizedEmail: { $type: "string" } } }
  )`);
  await client.close();
})();

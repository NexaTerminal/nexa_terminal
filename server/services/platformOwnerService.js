'use strict';

/**
 * Platform-owner guard.
 *
 * Whitelist of normalized emails that are guaranteed to remain
 * `role: 'admin'` regardless of any DB change. Called at server startup
 * and after every login to self-heal.
 *
 * Source list is env-driven (comma-separated PLATFORM_OWNER_EMAILS) with
 * a hardcoded default so the owner stays admin even if the env is wiped.
 */

const { normalizeEmail } = require('../utils/emailNormalize');

const DEFAULT_OWNERS = ['martinboshkoskilaw@gmail.com'];

function getOwnerSet() {
  const fromEnv = String(process.env.PLATFORM_OWNER_EMAILS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const all = [...DEFAULT_OWNERS, ...fromEnv];
  return new Set(all.map(normalizeEmail).filter(Boolean));
}

function isPlatformOwnerEmail(email) {
  const n = normalizeEmail(email);
  if (!n) return false;
  return getOwnerSet().has(n);
}

/**
 * Ensure every platform-owner account stored in the DB has role='admin' +
 * isAdmin=true. Idempotent. Logs an info line for each fixed record.
 */
async function ensurePlatformOwners(db) {
  const owners = Array.from(getOwnerSet());
  if (owners.length === 0) return;

  const col = db.collection('users');
  // Match by normalizedEmail OR by raw email (case-insensitive) — covers
  // records that predate the backfill.
  const rxs = owners.map(e => new RegExp('^' + e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'));
  const query = { $or: [
    { normalizedEmail: { $in: owners } },
    { email:           { $in: rxs } }
  ]};
  const docs = await col.find(query, { projection: { _id: 1, email: 1, role: 1, isAdmin: 1 } }).toArray();

  let fixed = 0;
  for (const u of docs) {
    if (u.role !== 'admin' || u.isAdmin !== true) {
      await col.updateOne(
        { _id: u._id },
        { $set: { role: 'admin', isAdmin: true, emailVerified: true, updatedAt: new Date() } }
      );
      fixed++;
      console.log(`👑 Promoted platform owner ${u.email} → role=admin`);
    }
  }
  if (docs.length === 0) {
    console.log(`ℹ Platform-owner whitelist is set but no matching DB user yet (owners: ${owners.join(', ')}).`);
  } else if (fixed === 0) {
    console.log(`✅ Platform owners already at role=admin (${docs.length}).`);
  }
}

module.exports = { isPlatformOwnerEmail, ensurePlatformOwners };

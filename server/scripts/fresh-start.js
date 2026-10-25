#!/usr/bin/env node
/**
 * scripts/fresh-start.js — erase every non-admin user and all user activity,
 * keeping the admin account (+ its own data), articles, announcements and
 * admin/system content. See tasks/fresh-start-plan.md.
 *
 *   npm run fresh-start                          # DRY RUN on "nexa" (counts only)
 *   npm run fresh-start -- --db nexa_restore_test --confirm=nexa_restore_test
 *   npm run fresh-start -- --confirm=nexa        # REAL run on the live database
 *
 * Take a backup first (npm run backup); undo with npm run restore.
 */

const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env';
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });

const ADMIN_EMAIL = 'martinboshkoskilaw@gmail.com';

// Admin/system content — never touched (except the reference clean-ups below).
const KEEP = new Set([
  'audit_logs', 'blog_submissions', 'blogs', 'chatbot_documents', 'cold_email_templates', 'contacts',
  'counters', 'fair_settings', 'inquiries', 'invited_prospects', 'newsletter_subscribers', 'offer_requests',
  'outreach_contacts', 'outreach_drip_settings', 'outreach_lists', 'procurement_register', 'promo_codes',
  'qa_worklist', 'sales_deals', 'service_providers', 'socialPosts', 'socialposts', 'topics_pages', 'updates',
]);

// User activity — every document is deleted unless it belongs to the admin alone.
const CLEAR = new Set([
  'activity_logs', 'badges', 'cases', 'character_assessments', 'chatbot_conversations', 'chatbot_usage',
  'chcAssessments', 'clients', 'contract_analyses', 'contract_analysis_usage', 'contracts', 'courseProgress',
  'credit_transactions', 'custom_templates', 'emailVerifications', 'employees', 'employer_badge_checks',
  'fair_booths', 'hhcAssessments', 'hr_interviews', 'inquiry_interest_signals', 'investments', 'leads',
  'lhcAssessments', 'marketing_chatbot_usage', 'mhcAssessments', 'newsletter_ad_bookings', 'pro_requests',
  'provider_interests', 'qa_submissions', 'shared_documents', 'sourcing_requests', 'subscription_history',
  'teaser_screenings', 'template_generations', 'template_versions', 'user_agent_memory', 'user_ai_memory',
  'user_analytics', 'user_notifications', 'user_stance_preferences',
]);

// Dummy data — emptied completely.
const WIPE = new Set(['invoices', 'proInvoices']);

// GridFS buckets (<bucket>.files / <bucket>.chunks): files follow the CLEAR rule,
// chunks go with their file.
const GRIDFS = ['custom_template_files', 'generated_documents', 'shared_documents'];

const arg = (name) => {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return null;
  if (hit.includes('=')) return hit.slice(hit.indexOf('=') + 1);
  const next = process.argv[process.argv.indexOf(hit) + 1];
  return next && !next.startsWith('--') ? next : '';
};

// Every user id / email a document mentions, at any depth.
function refsOf(value, out = new Set(), depth = 0) {
  if (value == null || depth > 8) return out;
  if (value instanceof ObjectId) { out.add(value.toHexString()); return out; }
  if (typeof value === 'string') { out.add(value.toLowerCase()); return out; }
  if (Array.isArray(value)) { value.slice(0, 500).forEach((v) => refsOf(v, out, depth + 1)); return out; }
  if (typeof value === 'object' && !(value instanceof Date) && !Buffer.isBuffer(value)) {
    for (const [k, v] of Object.entries(value)) if (!(depth === 0 && k === '_id')) refsOf(v, out, depth + 1);
  }
  return out;
}

async function main() {
  const dbName = arg('db') || 'nexa';
  const confirm = arg('confirm');
  const live = confirm === dbName;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(dbName);
  console.log(`[fresh-start] ${live ? '⚠️  LIVE RUN' : 'DRY RUN (counts only)'} on "${dbName}"`);

  try {
    const users = await db.collection('users').find({}).toArray();
    const admins = users.filter((u) => u.role === 'admin'
      && [u.email, u.normalizedEmail, u.officialEmail].some((e) => String(e || '').toLowerCase() === ADMIN_EMAIL));
    if (admins.length !== 1) throw new Error(`Expected exactly 1 admin with ${ADMIN_EMAIL}, found ${admins.length} — aborting`);
    const admin = admins[0];
    const adminKeys = refsOf({ id: admin._id, e: [admin.email, admin.normalizedEmail, admin.officialEmail].filter(Boolean) });
    const others = users.filter((u) => !u._id.equals(admin._id));
    const otherKeys = new Set();
    for (const u of others) {
      otherKeys.add(u._id.toHexString());
      [u.email, u.normalizedEmail, u.officialEmail].filter(Boolean).forEach((e) => otherKeys.add(String(e).toLowerCase()));
    }
    const otherIds = others.map((u) => u._id);
    console.log(`  admin kept: ${admin.username || admin._id} | users to delete: ${others.length}`);

    // Safety: every collection must be classified.
    const names = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name)
      .filter((n) => !n.startsWith('system.'));
    const gridNames = new Set(GRIDFS.flatMap((b) => [`${b}.files`, `${b}.chunks`]));
    const unknown = names.filter((n) => n !== 'users' && !KEEP.has(n) && !CLEAR.has(n) && !WIPE.has(n) && !gridNames.has(n));
    if (unknown.length) throw new Error(`Unclassified collections (add them to KEEP/CLEAR first): ${unknown.join(', ')}`);

    // Admin-only documents survive; anything else in a CLEAR collection goes.
    const adminOnly = (doc) => {
      const r = refsOf(doc);
      let mine = false;
      for (const k of r) { if (otherKeys.has(k)) return false; if (adminKeys.has(k)) mine = true; }
      return mine;
    };

    const rows = [];
    const run = async (name, ids) => {
      if (live && ids.length) await db.collection(name).deleteMany({ _id: { $in: ids } });
    };

    // users
    rows.push(['users', users.length, others.length]);
    if (live) await db.collection('users').deleteMany({ _id: { $in: otherIds } });

    for (const name of names) {
      if (WIPE.has(name)) {
        const n = await db.collection(name).countDocuments();
        rows.push([name, n, n]);
        if (live) await db.collection(name).deleteMany({});
      } else if (CLEAR.has(name) || name.endsWith('.files') && gridNames.has(name)) {
        const docs = await db.collection(name).find({}).toArray();
        const del = docs.filter((d) => !adminOnly(d)).map((d) => d._id);
        rows.push([name, docs.length, del.length]);
        await run(name, del);
      }
    }

    // GridFS chunks whose file is gone (or will be).
    for (const bucket of GRIDFS) {
      const chunks = `${bucket}.chunks`;
      if (!names.includes(chunks)) continue;
      const files = await db.collection(`${bucket}.files`).find({}).toArray();
      const keepFiles = new Set(files.filter((f) => adminOnly(f)).map((f) => String(f._id)));
      const all = await db.collection(chunks).find({}, { projection: { files_id: 1 } }).toArray();
      const del = all.filter((c) => !keepFiles.has(String(c.files_id))).map((c) => c._id);
      rows.push([chunks, all.length, del.length]);
      await run(chunks, del);
    }

    // Kept collections: strip references to deleted users.
    const promo = await db.collection('promo_codes').countDocuments({ redeemedBy: { $in: otherIds } });
    const inq = await db.collection('inquiries').countDocuments({ 'approvals.memberId': { $in: otherIds } });
    if (live) {
      await db.collection('promo_codes').updateMany({}, { $pull: { redeemedBy: { $in: otherIds } } });
      await db.collection('inquiries').updateMany({}, { $pull: { approvals: { memberId: { $in: otherIds } } } });
    }

    console.log(`\n  ${'collection'.padEnd(30)} ${'total'.padStart(6)} ${'delete'.padStart(7)} ${'keep'.padStart(6)}`);
    let totalDel = 0;
    for (const [n, t, d] of rows) {
      totalDel += d;
      if (t) console.log(`  ${n.padEnd(30)} ${String(t).padStart(6)} ${String(d).padStart(7)} ${String(t - d).padStart(6)}`);
    }
    console.log(`\n  references removed: promo_codes ${promo} doc(s), inquiries ${inq} doc(s) (pro approvals)`);
    console.log(`  untouched: ${[...KEEP].filter((k) => names.includes(k)).join(', ')}`);
    console.log(`\n[fresh-start] ${live ? '✅ deleted' : 'would delete'} ${totalDel} documents.${live ? '' : ' Nothing was changed.'}`);
  } finally {
    await client.close();
  }
}

main().catch((err) => { console.error('[fresh-start] ❌', err.message); process.exit(1); });

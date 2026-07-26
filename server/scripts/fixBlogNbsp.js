#!/usr/bin/env node
'use strict';

/**
 * One-time cleanup: replace non-breaking spaces (&nbsp; / U+00A0) with regular
 * spaces in every blog's `content`.
 *
 * Some blog content was authored/generated with a non-breaking space between
 * every word. Non-breaking spaces forbid line breaks between words, so the
 * browser has no legal break point and is forced to split words mid-word at the
 * right margin (looks justified, cuts words). Converting them to regular spaces
 * restores normal word wrapping.
 *
 * New/updated blogs are normalized at save time in blogController
 * (formatContentToParagraphs); this script fixes existing rows.
 *
 *   node server/scripts/fixBlogNbsp.js          # dry run (reports only)
 *   node server/scripts/fixBlogNbsp.js --apply  # write changes
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const APPLY = process.argv.includes('--apply');

function normalize(content) {
  if (typeof content !== 'string') return content;
  return content
    .replace(/&nbsp;|&#160;|&#xA0;/gi, ' ')
    .replace(/\u00A0/g, ' ');
}

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  const client = new MongoClient(uri);
  await client.connect();
  const dbName = (new URL(uri).pathname || '/nexa').slice(1) || 'nexa';
  const db = client.db(dbName);
  const col = db.collection('blogs');

  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — scanning blogs for &nbsp;/U+00A0…`);
  const cursor = col.find({ content: { $type: 'string' } }, { projection: { _id: 1, slug: 1, title: 1, content: 1 } });

  let total = 0, changed = 0, totalReplaced = 0;
  while (await cursor.hasNext()) {
    const b = await cursor.next();
    total++;
    const cleaned = normalize(b.content);
    if (cleaned === b.content) continue;

    const nbspCount = (b.content.match(/&nbsp;/gi) || []).length + (b.content.match(/\u00A0/g) || []).length;
    totalReplaced += nbspCount;
    changed++;
    console.log(`  ${changed}. ${b.slug || b._id} — ${nbspCount} nbsp`);

    if (APPLY) {
      await col.updateOne({ _id: b._id }, { $set: { content: cleaned } });
    }
  }

  console.log(`\nScanned ${total} blogs. ${changed} need cleanup (${totalReplaced} nbsp total).`);
  console.log(APPLY ? 'Changes written.' : 'Dry run — re-run with --apply to write changes.');
  await client.close();
})();

require('dotenv').config({ path: __dirname + '/../.env.development' });
const { QdrantClient } = require('@qdrant/js-client-rest');

/**
 * Migrate "foreign-schema" chunks in the nexa_legal_docs collection.
 *
 * Background: a parallel ingestion pipeline uploaded ~42K chunks with payload
 * keys { content, filename, article_number, chunk_index, document_type, ... }
 * while the chatbot reads { pageContent, documentName, article, chunkType }.
 * Result: 84% of the knowledge base (newer consolidated laws, Апелационен суд
 * judgments, court bulletins, Коментар на ЗРО, tax journals) was invisible to
 * retrieval — and worse, crashed it (pageContent undefined → TypeError → the
 * whole query fell back to zero context).
 *
 * This script, WITHOUT re-embedding (vectors are kept as-is, zero OpenAI cost):
 *   1. Rewrites every foreign chunk's payload into the canonical schema
 *      (article_number "76" → article "Член 76" so verified citations work).
 *   2. Deletes junk (marketing PDFs, blog dumps, test files) and stale
 *      tax-journal issues (Reprezent 2021-2022 — superseded rates).
 *   3. Creates the full-text payload index keyword search requires.
 *
 * Usage:
 *   node scripts/migrate-foreign-chunks.js --dry   # preview only
 *   node scripts/migrate-foreign-chunks.js         # execute
 */

const DRY = process.argv.includes('--dry');
const COLLECTION = process.env.QDRANT_COLLECTION_NAME || 'nexa_legal_docs';

// Files that have no place in a legal knowledge base.
const JUNK_PATTERNS = [
  /^marketing\.ai\.training\.JSON$/i,
  /^blogs\.json$/i,
  /^test-law\.txt$/i,
  /^mckinsey-technology-trends/i,
  /^agents-robots-and-us/i,
  /^the-state-of-ai-2025/i,
  /^state-of-marketing-europe/i,
  /^modern-marketing-what-it-is/i,
  /^The dawn of marketings golden age/i,
  /^The changing face of marketing/i,
  /^Flyer-Print-Ready/i,
  /^20\.11\.pdf$/i,
  /^2025\.05-1152199174\.pdf$/i,
];

/** Reprezent journal year (last 2-digit dash group): stale if 2021/2022. */
function isStaleJournal(filename) {
  if (!/^Reprezent-/i.test(filename)) return false;
  const groups = filename.match(/-(\d{2})(?=[-. (])/g);
  if (!groups) return false;
  const year = groups[groups.length - 1].replace('-', '');
  return year === '21' || year === '22';
}

function isJunk(filename) {
  return JUNK_PATTERNS.some(re => re.test(filename || ''));
}

/** Year from gazette-style names ("74-25-ZRO" → 2025) or embedded dates. */
function docYearOf(filename) {
  if (!filename) return null;
  let m = filename.match(/^\d{1,3}[-_](\d{2})[-_]/);
  if (m) return 2000 + parseInt(m[1], 10);
  m = filename.match(/\d{2}\.\d{2}\.(20\d{2})/);
  if (m) return parseInt(m[1], 10);
  m = filename.match(/(?:^|[_\-\s])(20\d{2})(?:[._\-\s]|$)/);
  if (m) return parseInt(m[1], 10);
  if (/^Reprezent-/i.test(filename)) {
    const groups = filename.match(/-(\d{2})(?=[-. (])/g);
    if (groups) return 2000 + parseInt(groups[groups.length - 1].replace('-', ''), 10);
  }
  return null;
}

/** Retry a Qdrant call up to 4 times with exponential backoff (cloud hiccups). */
async function withRetry(label, fn) {
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try { return await fn(); } catch (e) {
      lastErr = e;
      const wait = attempt * 3000;
      console.warn(`  ⚠ ${label} failed (attempt ${attempt}/4): ${e.message} — retrying in ${wait / 1000}s`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

async function main() {
  const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
    timeout: 120000, // vectors-included pages are heavy; default timeout is too tight
  });

  const info = await client.getCollection(COLLECTION);
  console.log(`Collection "${COLLECTION}": ${info.points_count} points${DRY ? '  [DRY RUN]' : ''}\n`);

  let offset = null;
  let migrated = 0, junked = 0, staleJournals = 0, alreadyOk = 0, batchNo = 0;
  const deleteIds = [];

  do {
    const page = await withRetry('scroll', () => client.scroll(COLLECTION, {
      limit: 128,
      with_payload: true,
      with_vector: true,
      offset,
    }));

    const upserts = [];
    for (const p of page.points) {
      const pl = p.payload || {};
      if (pl.documentName) { alreadyOk++; continue; } // canonical already

      const filename = pl.filename || 'Unknown';
      if (isJunk(filename)) { deleteIds.push(p.id); junked++; continue; }
      if (isStaleJournal(filename)) { deleteIds.push(p.id); staleJournals++; continue; }

      const article = pl.article_number != null && String(pl.article_number).trim() !== ''
        ? `Член ${String(pl.article_number).trim()}`
        : null;

      upserts.push({
        id: p.id,
        vector: p.vector,
        payload: {
          pageContent: pl.content || '',
          documentName: filename,
          article,
          chunkType: pl.document_type || pl.type || 'migrated',
          pageCount: pl.pages || null,
          docYear: docYearOf(filename),
          isBrochure: /^Reprezent-/i.test(filename) || pl.document_type === 'magazine',
          chunkIndex: pl.chunk_index ?? null,
          totalChunks: pl.total_chunks ?? null,
          source: pl.source || null,
          processedAt: new Date().toISOString(),
          migratedFrom: 'foreign-schema',
        },
      });
    }

    if (!DRY && upserts.length > 0) {
      await withRetry('upsert', () => client.upsert(COLLECTION, { wait: true, points: upserts }));
    }
    migrated += upserts.length;
    batchNo++;
    if (batchNo % 20 === 0) {
      console.log(`  ...batch ${batchNo}: migrated ${migrated}, junk ${junked}, stale journals ${staleJournals}`);
    }

    offset = page.next_page_offset;
  } while (offset);

  console.log(`\nMigrated: ${migrated}  |  junk deleted: ${junked}  |  stale journals deleted: ${staleJournals}  |  already canonical: ${alreadyOk}`);

  if (!DRY && deleteIds.length > 0) {
    console.log(`Deleting ${deleteIds.length} junk/stale points...`);
    for (let i = 0; i < deleteIds.length; i += 500) {
      await withRetry('delete', () => client.delete(COLLECTION, { wait: true, points: deleteIds.slice(i, i + 500) }));
    }
    console.log('  ✓ deleted');
  }

  if (!DRY) {
    console.log('Creating full-text payload index on pageContent (keyword search)...');
    try {
      await client.createPayloadIndex(COLLECTION, {
        field_name: 'pageContent',
        field_schema: { type: 'text', tokenizer: 'word', lowercase: true },
        wait: true,
      });
      console.log('  ✓ index created');
    } catch (e) {
      console.log('  index note:', e.message); // already exists is fine
    }
    const after = await client.getCollection(COLLECTION);
    console.log(`\nFinal collection size: ${after.points_count} points`);
  }

  console.log(DRY ? '\nDry run complete — re-run without --dry to execute.' : '\n✅ Migration complete.');
}

main().catch(err => { console.error('❌', err); process.exit(1); });

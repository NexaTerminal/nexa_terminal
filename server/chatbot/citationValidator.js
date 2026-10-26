'use strict';

/**
 * Post-generation citation validator.
 *
 * The prompt tells the model to cite only „ВЕРИФИЦИРАН ЧЛЕН: N" articles, but
 * nothing enforced it. After every answer we find each cited article („Член 23",
 * „чл. 5", „членови 10 и 11") and check it against the articles actually present
 * in the retrieved, citable law excerpts (chunk metadata.article — set at
 * ingestion from the statute text, so it is ground truth).
 *
 * Unverified numbers are never shown as fact: each gets an inline ⚠ marker and
 * the answer gets one footnote telling the user to check the Official Gazette.
 * Verified ones come back as structured citations (law + article + confidence
 * band) for the chips under the answer.
 */

const UNVERIFIED_MARK = ' ⚠';
const FOOTNOTE =
  '\n\n> ⚠ Членовите означени со ⚠ не ги најдовме во законските текстови што ги користевме за овој одговор. ' +
  'Проверете ги во „Службен весник“ или кај адвокат пред да се потпрете на нив.';

// „Член 23", „член 23-а", „чл. 5", „членови 10, 11 и 12", „членот 7", „Article 5" excluded on purpose.
// The list part captures further numbers joined by „,", „и", „или", „-", „–", „до".
// A joined number followed by a unit („и 30 дена", „и 2024 година") is not an article.
const NUM = String.raw`\d{1,4}(?!\d)(?:(?:\s?[-‑]\s?)?[абвгдежa-e](?![\p{L}]))?`;
const NOT_UNIT = String.raw`(?!\s*(?:%|год|ден|месец|недел|час|евр|eur|мкд|пат|лиц|работ))`;
const CITE_RE = new RegExp(
  String.raw`(?<![\p{L}])(член(?:ови(?:те)?|от)?|чл\.)\s*(${NUM}(?:\s*(?:,|и|или|-|–|до)\s*${NUM}${NOT_UNIT})*)`,
  'giu'
);
const NUM_RE = new RegExp(NUM, 'giu');

/** „23-а" / „23 а" / „23а" → „23а" (lowercase Cyrillic/Latin suffix kept). */
function normalizeArticle(raw) {
  return String(raw || '').toLowerCase().replace(/[\s\-‑]/g, '');
}

/** Confidence band from the retrieval score (cosine; keyword-only hits sit at 0.3). */
function confidenceBand(score) {
  if (score >= 0.55) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

/** Readable law title from the ingested file name (same cleanup as ingestion's cleanDocTitle). */
function prettyDocName(name) {
  return String(name || '')
    .replace(/\.(pdf|docx?|txt)$/i, '')
    .replace(/\d{2}\.\d{2}\.\d{4}/g, '')
    .replace(/^[\d\-_.]+/, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[,\s]+$/, '')
    .trim()
    .slice(0, 90) || String(name || '');
}

// ── Which law does a citation name? ─────────────────────────────────────────
// „Член 47 од Законот за работните односи" / „член 47 од ЗРО" → the article must
// come from THAT law. Laws are matched by word stems of the title after „за",
// or by acronym (Закон за работните односи → ЗРО).
const LAW_STOP = new Set(['за', 'на', 'и', 'од', 'со', 'во', 'или', 'по']);
const stem = (w) => w.toLowerCase().slice(0, 5);
const words = (t) => String(t).toLowerCase().split(/[^\p{L}]+/u).filter(Boolean);

function lawKeyOf(title) {
  const m = String(title).match(/закон(?:от|ик|икот)?\s+за\s+(.+)$/iu);
  if (!m) return null;
  const sig = words(m[1]).filter((w) => !LAW_STOP.has(w));
  if (!sig.length) return null;
  return { stems: sig.map(stem), acronym: ('з' + sig.map((w) => w[0]).join('')).toUpperCase() };
}

// Right after the article list: optional „став N" / „точка N", then „од/на/во"
// and either „Законот за …" or an acronym like „ЗРО".
const LAW_TAIL_RE = /^[\s,]*(?:(?:став|ст\.|точка|т\.|алинеја)\s*\d+\s*,?\s*)*(?:(?:од|на|во|според)\s+)?(?:\*\*)?\(?(?:([Зз]акон(?:от|ик|икот)?\s+за\s+[\p{L}\s]{3,80})|([ЗзZ][\p{Lu}]{1,5})(?![\p{L}]))/u;

/** → { stems } | { acronym } | null for the law named right after a citation. */
function lawNamedAfter(tail) {
  const m = tail.match(LAW_TAIL_RE);
  if (!m) return null;
  if (m[1]) {
    const sig = words(m[1].replace(/^закон(?:от|ик|икот)?\s+за\s+/iu, '')).filter((w) => !LAW_STOP.has(w));
    return sig.length ? { stems: sig.map(stem) } : null;
  }
  return { acronym: m[2].toUpperCase() };
}

/** Does a retrieved doc's law key match the law the citation names? */
function lawMatches(named, key) {
  if (!key) return false;
  if (named.acronym) return named.acronym === key.acronym;
  // The cited phrase must start with the doc title's stems (phrase may run on: „… односи е утврдено").
  return key.stems.every((s, i) => named.stems[i] === s);
}

/** article → candidates [{ article, documentName, score, lawKey }] among the citable retrieved docs. */
function buildVerifiedIndex(docs, isCitable) {
  const index = new Map();
  for (const doc of docs || []) {
    const meta = doc?.metadata || {};
    if (!meta.article || !isCitable(meta)) continue;
    const key = normalizeArticle(meta.article);
    const list = index.get(key) || [];
    list.push({
      article: String(meta.article).trim(),
      documentName: meta.documentName || '',
      score: Number(meta.score) || 0,
      lawKey: lawKeyOf(prettyDocName(meta.documentName)),
    });
    index.set(key, list);
  }
  return index;
}

/**
 * Best supporting excerpt for a cited article. When the citation names a law
 * we recognise among the retrieved docs, only that law's article counts; a
 * named law that wasn't retrieved at all means the article is unverified.
 */
function findSupport(candidates, named, allDocsKeys) {
  if (!candidates?.length) return null;
  let pool = candidates;
  if (named) {
    const lawRetrieved = allDocsKeys.some((k) => lawMatches(named, k));
    if (lawRetrieved) pool = candidates.filter((c) => lawMatches(named, c.lawKey));
    else if (named.stems) return null; // full law name given, but we never had that law
    // unknown acronym (not one of our retrieved laws) → fall back to number-only
  }
  return pool.reduce((best, c) => (!best || c.score > best.score ? c : best), null);
}

/**
 * @param {string} answer   - model answer (already stripped of [SUGGESTIONS])
 * @param {Array}  docs     - retrieved docs passed to the model as context
 * @param {Function} isCitable - isCitableSource(meta)
 * @returns {{ text: string, citations: Array, unverified: string[], cited: number }}
 */
function validateCitations(answer, docs, isCitable) {
  const text = String(answer || '');
  const index = buildVerifiedIndex(docs, isCitable);
  const allDocsKeys = [...index.values()].flat().map((c) => c.lawKey).filter(Boolean);
  const verified = new Map();   // law+article → citation (deduped, in order of appearance)
  const unverified = new Set();
  let cited = 0;

  const marked = text.replace(CITE_RE, (match, word, list, offset) => {
    const named = lawNamedAfter(text.slice(offset + match.length, offset + match.length + 120));
    const rebuilt = list.replace(NUM_RE, (num) => {
      cited += 1;
      const hit = findSupport(index.get(normalizeArticle(num)), named, allDocsKeys);
      if (hit) {
        const id = `${hit.documentName}#${normalizeArticle(hit.article)}`;
        if (!verified.has(id)) {
          verified.set(id, {
            article: hit.article,
            law: prettyDocName(hit.documentName),
            documentName: hit.documentName,
            score: Math.round(hit.score * 100) / 100,
            confidence: confidenceBand(hit.score),
          });
        }
        return num;
      }
      unverified.add(num.replace(/\s+/g, ''));
      return num + UNVERIFIED_MARK;
    });
    return match.slice(0, match.length - list.length) + rebuilt;
  });

  return {
    text: unverified.size ? marked + FOOTNOTE : text,
    citations: [...verified.values()],
    unverified: [...unverified],
    cited,
  };
}

module.exports = { validateCitations, normalizeArticle, confidenceBand, prettyDocName, FOOTNOTE };

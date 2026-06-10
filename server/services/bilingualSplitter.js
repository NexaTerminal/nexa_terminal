'use strict';

/**
 * Bilingual (MK/EN) document splitter.
 *
 * The custom-template builder generates the final document from the ORIGINAL
 * .docx (it injects docxtemplater tags into it). Bilingual documents — a
 * two-column "Macedonian | English" table, or alternating MK/EN paragraphs —
 * therefore break: only the Macedonian copy gets tagged, the English copy
 * stays frozen, and the AI field analysis sees interleaved text.
 *
 * Until multilingual templates are supported, we detect bilingual documents
 * and keep ONLY the Macedonian content so preview, AI analysis and generation
 * all operate on the same single-language source.
 *
 * Everything here fails safe: on ANY error or uncertainty, the original
 * buffer is returned untouched — a normal upload must never be blocked.
 */

const PizZip = require('pizzip');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

// --- language scoring ------------------------------------------------------

/** Count Cyrillic and Latin letters in a string. */
function letterCounts(text) {
  let cyr = 0;
  let lat = 0;
  for (const ch of String(text || '')) {
    const code = ch.codePointAt(0);
    if (code >= 0x0400 && code <= 0x04ff) cyr++;            // Cyrillic block
    else if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) lat++; // Basic Latin
  }
  return { cyr, lat };
}

/** Cyrillic share of the alphabetic characters (0..1). null if no letters. */
function cyrillicRatio(text) {
  const { cyr, lat } = letterCounts(text);
  const total = cyr + lat;
  if (total === 0) return null;
  return cyr / total;
}

const MK_RATIO = 0.6;   // ≥ this share of Cyrillic → Macedonian
const EN_RATIO = 0.15;  // ≤ this share of Cyrillic → English
const EN_MIN_LETTERS = 15; // a block must have this many Latin letters to count as "English content"

/** Classify a text block as 'mk' | 'en' | 'ambiguous'. */
function classify(text) {
  const { cyr, lat } = letterCounts(text);
  const total = cyr + lat;
  if (total === 0) return 'ambiguous';
  const ratio = cyr / total;
  if (ratio >= MK_RATIO) return 'mk';
  if (ratio <= EN_RATIO && lat >= EN_MIN_LETTERS) return 'en';
  return 'ambiguous';
}

// --- DOM helpers -----------------------------------------------------------

/** Direct child elements of `node` whose tag name equals `name`. */
function directChildren(node, name) {
  const out = [];
  const kids = node.childNodes;
  for (let i = 0; i < kids.length; i++) {
    const k = kids[i];
    if (k.nodeType === 1 && k.nodeName === name) out.push(k);
  }
  return out;
}

/** Concatenated text of all <w:t> descendants of `node`. */
function nodeText(node) {
  const ts = node.getElementsByTagName('w:t');
  let s = '';
  for (let i = 0; i < ts.length; i++) s += ts[i].textContent || '';
  return s;
}

/** True if `node` lives inside a table cell (i.e. it is a nested table). */
function isInsideCell(node) {
  let p = node.parentNode;
  while (p) {
    if (p.nodeName === 'w:tc') return true;
    if (p.nodeName === 'w:body') return false;
    p = p.parentNode;
  }
  return false;
}

// --- table split -----------------------------------------------------------

/**
 * If `tbl` is a side-by-side bilingual table (every data row has 2 cells, one
 * column Macedonian and the other English), remove the English column.
 * @returns {boolean} whether the table was split.
 */
function splitTable(tbl) {
  const rows = directChildren(tbl, 'w:tr');
  if (rows.length === 0) return false;

  const twoCellRows = [];
  let otherRows = 0;
  for (const row of rows) {
    const cells = directChildren(row, 'w:tc');
    if (cells.length === 2) twoCellRows.push(cells);
    else otherRows++;
  }

  // Need a clear majority of clean 2-cell rows to treat this as bilingual.
  if (twoCellRows.length < 2 || twoCellRows.length < otherRows) return false;

  // Aggregate each column's language across the 2-cell rows.
  let col0 = '';
  let col1 = '';
  for (const [c0, c1] of twoCellRows) {
    col0 += ' ' + nodeText(c0);
    col1 += ' ' + nodeText(c1);
  }
  const cls0 = classify(col0);
  const cls1 = classify(col1);

  let enIndex = -1;
  if (cls0 === 'mk' && cls1 === 'en') enIndex = 1;
  else if (cls0 === 'en' && cls1 === 'mk') enIndex = 0;
  else return false; // not a clean MK/EN pairing

  // Remove the English cell from every 2-cell row.
  for (const cells of twoCellRows) {
    const enCell = cells[enIndex];
    enCell.parentNode.removeChild(enCell);
  }

  // Drop one <w:gridCol> so the grid matches the surviving single column.
  const grids = tbl.getElementsByTagName('w:tblGrid');
  if (grids.length > 0) {
    const cols = directChildren(grids[0], 'w:gridCol');
    if (cols.length >= 2) {
      const drop = cols[Math.min(enIndex, cols.length - 1)];
      drop.parentNode.removeChild(drop);
    }
  }

  return true;
}

// --- main ------------------------------------------------------------------

/**
 * Analyze a .docx buffer and, if it is bilingual MK/EN, return a new buffer
 * with only the Macedonian content.
 *
 * @returns {{ buffer: Buffer, bilingual: boolean, splitApplied: boolean,
 *             method: ('table'|'paragraph'|'mixed'|null), stats: object }}
 */
function analyzeAndSplit(buffer) {
  const safe = {
    buffer,
    bilingual: false,
    splitApplied: false,
    method: null,
    stats: { tablesSplit: 0, paragraphsRemoved: 0 }
  };

  try {
    const zip = new PizZip(buffer);
    const xmlFile = zip.file('word/document.xml');
    if (!xmlFile) return safe;

    const doc = new DOMParser().parseFromString(xmlFile.asText(), 'text/xml');
    const bodies = doc.getElementsByTagName('w:body');
    if (!bodies || bodies.length === 0) return safe;
    const body = bodies[0];

    // Global language gate: the document must contain a meaningful amount of
    // BOTH scripts. A plain Macedonian doc with a few Latin company names
    // (LUTHMAN, DOO, MK4032…) must NOT trip this.
    const fullText = nodeText(doc);
    const { cyr, lat } = letterCounts(fullText);
    const total = cyr + lat;
    const enShare = total > 0 ? lat / total : 0;
    // Bilingual when Latin is a substantial share but not the whole document.
    const bilingual = cyr >= 100 && lat >= 100 && enShare >= 0.2 && enShare <= 0.8;
    safe.bilingual = bilingual;
    if (!bilingual) return safe;

    // --- table pass: remove the English column of bilingual tables ---
    const tables = doc.getElementsByTagName('w:tbl');
    const tableList = [];
    for (let i = 0; i < tables.length; i++) tableList.push(tables[i]);
    for (const tbl of tableList) {
      if (isInsideCell(tbl)) continue; // skip nested tables (conservative)
      try {
        if (splitTable(tbl)) safe.stats.tablesSplit++;
      } catch (_) { /* leave this table untouched */ }
    }

    // --- paragraph pass: drop clearly-English body paragraphs ---
    const bodyParas = directChildren(body, 'w:p');
    for (const p of bodyParas) {
      if (classify(nodeText(p)) === 'en') {
        p.parentNode.removeChild(p);
        safe.stats.paragraphsRemoved++;
      }
    }

    const changed = safe.stats.tablesSplit > 0 || safe.stats.paragraphsRemoved > 0;
    if (!changed) return safe;

    const out = new XMLSerializer().serializeToString(doc);
    zip.file('word/document.xml', out);
    const newBuffer = zip.generate({
      type: 'nodebuffer',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    safe.buffer = newBuffer;
    safe.splitApplied = true;
    safe.method = safe.stats.tablesSplit > 0 && safe.stats.paragraphsRemoved > 0
      ? 'mixed'
      : safe.stats.tablesSplit > 0 ? 'table' : 'paragraph';
    return safe;
  } catch (err) {
    // Never block an upload because of a split failure.
    console.warn('bilingualSplitter: split skipped —', err.message);
    return { ...safe, buffer };
  }
}

module.exports = { analyzeAndSplit, cyrillicRatio, classify, letterCounts };

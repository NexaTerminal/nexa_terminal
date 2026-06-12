const PizZip = require('pizzip');

/**
 * In-place .docx text editor.
 *
 * Replaces exact text inside an existing Word document while preserving all
 * original formatting, styles and structure — used to amend the user's REAL
 * incorporation act (keep their wording, change only the affected data).
 *
 * The run-aware replacement (text may be split across multiple <w:r> runs) and
 * the homoglyph/dash/space-insensitive matching are adapted from the proven
 * engine in controllers/customTemplateController.js.
 */

const HOMOGLYPHS = {
  'А': 'A', 'а': 'a', 'В': 'B', 'Е': 'E', 'е': 'e', 'К': 'K', 'к': 'k',
  'М': 'M', 'Н': 'H', 'О': 'O', 'о': 'o', 'Р': 'P', 'р': 'p', 'С': 'C',
  'с': 'c', 'Т': 'T', 'У': 'Y', 'у': 'y', 'Х': 'X', 'х': 'x', 'Ѕ': 'S',
  'ѕ': 's', 'Ј': 'J', 'ј': 'j', 'І': 'I', 'і': 'i', 'Ё': 'E'
};
const DASH_CHARS = new Set(['‐', '‑', '‒', '–', '—', '―', '−']);
const SPACE_CHARS = new Set([' ', ' ', ' ', ' ']);

/** Length-preserving normalization for fuzzy matching (1:1 char mapping). */
function normalizeForMatch(s) {
  let out = '';
  for (const ch of s) {
    if (HOMOGLYPHS[ch]) out += HOMOGLYPHS[ch];
    else if (DASH_CHARS.has(ch)) out += '-';
    else if (SPACE_CHARS.has(ch)) out += ' ';
    else out += ch;
  }
  return out;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Replace text that may be split across multiple <w:r> runs in one paragraph.
 * `replacement` must already be XML-escaped. Returns the modified XML.
 */
function replaceTextAcrossRuns(xml, searchText, replacement, replaceAll = true) {
  const paragraphRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  const paragraphs = (xml.match(paragraphRegex) || []);

  for (const paragraph of paragraphs) {
    const textParts = [];
    const runRegex = /<w:r\b[^>]*>[\s\S]*?<\/w:r>/g;
    let runMatch;
    const runs = [];

    while ((runMatch = runRegex.exec(paragraph)) !== null) {
      const run = runMatch[0];
      const textMatch = run.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/);
      const text = textMatch ? textMatch[1] : '';
      runs.push({ fullMatch: run, text, index: runMatch.index });
      textParts.push(text);
    }

    const fullText = textParts.join('');
    const searchIndex = normalizeForMatch(fullText).indexOf(normalizeForMatch(searchText));
    if (searchIndex === -1) continue;

    let charCount = 0;
    let startRunIdx = -1;
    let endRunIdx = -1;
    let startCharInRun = 0;
    let endCharInRun = 0;

    for (let i = 0; i < runs.length; i++) {
      const runStart = charCount;
      const runEnd = charCount + runs[i].text.length;
      if (startRunIdx === -1 && searchIndex < runEnd) {
        startRunIdx = i;
        startCharInRun = searchIndex - runStart;
      }
      if (startRunIdx !== -1 && searchIndex + searchText.length <= runEnd) {
        endRunIdx = i;
        endCharInRun = searchIndex + searchText.length - runStart;
        break;
      }
      charCount = runEnd;
    }

    if (startRunIdx === -1 || endRunIdx === -1) continue;

    let newParagraph = paragraph;
    if (startRunIdx === endRunIdx) {
      const run = runs[startRunIdx];
      const newText = run.text.substring(0, startCharInRun) + replacement + run.text.substring(endCharInRun);
      const newRun = run.fullMatch.replace(/<w:t[^>]*>[\s\S]*?<\/w:t>/, `<w:t xml:space="preserve">${newText}</w:t>`);
      newParagraph = newParagraph.replace(run.fullMatch, newRun);
    } else {
      const endRun = runs[endRunIdx];
      const endRemaining = endRun.text.substring(endCharInRun);
      if (endRemaining) {
        const newEndRun = endRun.fullMatch.replace(/<w:t[^>]*>[\s\S]*?<\/w:t>/, `<w:t xml:space="preserve">${endRemaining}</w:t>`);
        newParagraph = newParagraph.replace(endRun.fullMatch, newEndRun);
      } else {
        newParagraph = newParagraph.replace(endRun.fullMatch, '');
      }
      for (let i = endRunIdx - 1; i > startRunIdx; i--) {
        newParagraph = newParagraph.replace(runs[i].fullMatch, '');
      }
      const startRun = runs[startRunIdx];
      const startKeep = startRun.text.substring(0, startCharInRun);
      const newStartRun = startRun.fullMatch.replace(
        /<w:t[^>]*>[\s\S]*?<\/w:t>/,
        `<w:t xml:space="preserve">${startKeep}${replacement}</w:t>`
      );
      newParagraph = newParagraph.replace(startRun.fullMatch, newStartRun);
    }

    xml = xml.replace(paragraph, newParagraph);
    if (!replaceAll) break;
  }

  return xml;
}

/**
 * Apply a list of { find, replace } text replacements to a .docx buffer.
 * Returns { buffer, applied:[{find, replace, matched}] } so callers can report
 * which replacements actually landed (matched=false → the old text wasn't found
 * verbatim and the user should review).
 */
function replaceInDocx(buffer, replacements) {
  const zip = new PizZip(buffer);
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) throw new Error('Невалиден .docx: недостасува word/document.xml');
  let xml = docXmlFile.asText();
  const applied = [];

  for (const r of replacements) {
    const find = (r.find || '').trim();
    const replace = r.replace == null ? '' : String(r.replace);
    if (!find || normalizeForMatch(find).trim() === '') {
      applied.push({ ...r, matched: false });
      continue;
    }
    const before = xml;
    xml = replaceTextAcrossRuns(xml, find, escapeXml(replace), r.replaceAll !== false);
    applied.push({ ...r, matched: xml !== before });
  }

  zip.file('word/document.xml', xml);
  const out = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  return { buffer: out, applied };
}

module.exports = { replaceInDocx, normalizeForMatch };

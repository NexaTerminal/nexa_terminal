// Nexa „Проверен работодавач" badge engine.
//
// Pure, dependency-free helpers: rating tier from a compliance score, a random
// share token, and the dynamic SVG assets (circular seal + certificate). The
// seal is intentionally company-agnostic (brand + rating only) so it is
// cacheable and reads as a trust-mark; the company name lives on the verify page
// and certificate. All user-supplied text is escaped.
//
// FRAMING: this is a self-assessment maturity signal ("самопроценка"), never a
// legal certification — keep that wording in every asset.

const crypto = require('crypto');

// Brand palette (Nexa primary #1E4DB7).
const C = {
  ink: '#0F2A6B',
  brand: '#1E4DB7',
  gold: '#C9A227',
  goldLight: '#E7C65A',
  green: '#16A34A',
  paper: '#FFFFFF',
  soft: '#DBEAFE',
  gray: '#6B7280',
};

/** Rating tier from a 0–100 compliance score. Below 65 → no badge. */
function ratingForScore(pct) {
  const p = Number(pct) || 0;
  if (p >= 93) return { tier: 'A++', label: 'Извонредна усогласеност', min: 93 };
  if (p >= 80) return { tier: 'A+',  label: 'Силна усогласеност',     min: 80 };
  if (p >= 65) return { tier: 'A',   label: 'Солидна усогласеност',   min: 65 };
  return null; // not eligible for a badge
}

const BADGE_MIN_SCORE = 65;

/** Unguessable, URL-safe share token. */
function generateToken() {
  return crypto.randomBytes(16).toString('hex'); // 32 hex chars
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function fmtDate(d) {
  const dt = d ? new Date(d) : new Date();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  return `${mm}.${dt.getFullYear()}`;
}

/**
 * Circular seal SVG (company-agnostic trust-mark). 240×240 viewBox, scales
 * cleanly down to ~96px. Shows brand, „ПРОВЕРЕН РАБОТОДАВАЧ", the rating tier,
 * and the „самопроценка" caption.
 */
function sealSVG({ tier = 'A', verified = false } = {}) {
  const ringGap = verified ? '' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240" role="img" aria-label="Nexa Проверен работодавач — рејтинг ${esc(tier)}">
  <defs>
    <path id="arcTop" d="M 44 120 A 76 76 0 0 1 196 120" />
    <path id="arcBot" d="M 40 120 A 80 80 0 0 0 200 120" />
    <linearGradient id="ring" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.goldLight}"/>
      <stop offset="1" stop-color="${C.gold}"/>
    </linearGradient>
  </defs>
  <circle cx="120" cy="120" r="116" fill="${C.paper}"/>
  <circle cx="120" cy="120" r="116" fill="none" stroke="url(#ring)" stroke-width="6"/>
  <circle cx="120" cy="120" r="104" fill="none" stroke="${C.brand}" stroke-width="2"/>
  <circle cx="120" cy="120" r="88"  fill="${C.brand}"/>

  <!-- arc texts on the gold ring -->
  <text font-family="Arial, sans-serif" font-weight="700" letter-spacing="3" font-size="15" fill="${C.ink}">
    <textPath href="#arcTop" startOffset="50%" text-anchor="middle">N E X A</textPath>
  </text>
  <text font-family="Arial, sans-serif" font-weight="600" letter-spacing="1.5" font-size="10.5" fill="${C.gray}">
    <textPath href="#arcBot" startOffset="50%" text-anchor="middle">самопроценка · важи 1 година</textPath>
  </text>

  <!-- shield + check -->
  <path d="M120 58 l26 9 v20 c0 20 -13 33 -26 40 c-13 -7 -26 -20 -26 -40 v-20 z" fill="${C.paper}" opacity="0.14"/>
  <path d="M108 96 l9 9 l17 -18" fill="none" stroke="${C.goldLight}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- label -->
  <text x="120" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="15" fill="${C.paper}" letter-spacing="0.5">ПРОВЕРЕН</text>
  <text x="120" y="167" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="15" fill="${C.paper}" letter-spacing="0.5">РАБОТОДАВАЧ</text>

  <!-- rating chip -->
  <circle cx="120" cy="192" r="17" fill="${C.gold}"/>
  <text x="120" y="198" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="15" fill="${C.ink}">${esc(tier)}</text>
  ${verified ? `<circle cx="150" cy="192" r="7" fill="${C.green}"/><path d="M147 192 l2 2 l4 -5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
</svg>`;
}

// Shrink a font size so `text` fits within `maxWidth` (rough per-glyph width
// factor `k`), clamped to [min, base]. Keeps long company names from breaking
// the centered, symmetric composition.
function fitSize(text, maxWidth, base, min, k) {
  const len = (text || '').length || 1;
  return Math.max(min, Math.min(base, Math.floor(maxWidth / (len * k))));
}

/**
 * Landscape certificate SVG (1200×850) for preview. Centered, symmetric layout;
 * the company name auto-fits so it never overflows. (The downloadable file is a
 * real PDF — see certificatePDF — this SVG mirrors it for on-screen preview.)
 */
function certificateSVG({ companyName, tier = 'A', ratingLabel = '', issuedAt, expiresAt, token, verified = false } = {}) {
  const issued = fmtDate(issuedAt);
  const expires = fmtDate(expiresAt);
  const name = esc(companyName || 'Вашата компанија');
  const nameSize = fitSize(companyName || 'Вашата компанија', 940, 40, 20, 0.58);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 850" width="1200" height="850" role="img" aria-label="Сертификат — Проверен работодавач">
  <rect width="1200" height="850" fill="${C.paper}"/>
  <rect x="28" y="28" width="1144" height="794" fill="none" stroke="${C.gold}" stroke-width="4"/>
  <rect x="40" y="40" width="1120" height="770" fill="none" stroke="${C.brand}" stroke-width="1.5"/>

  <text x="600" y="132" text-anchor="middle" font-family="Georgia, serif" font-weight="700" letter-spacing="8" font-size="30" fill="${C.brand}">N E X A</text>
  <text x="600" y="192" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" letter-spacing="2" font-size="36" fill="${C.ink}">ПРОВЕРЕН РАБОТОДАВАЧ</text>
  <text x="600" y="226" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="${C.gray}">Потврда за спроведена правна проверка (самопроценка)</text>
  <line x1="420" y1="258" x2="780" y2="258" stroke="${C.soft}" stroke-width="2"/>

  <text x="600" y="330" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="${C.gray}" letter-spacing="1">СЕ ПОТВРДУВА ДЕКА</text>
  <text x="600" y="386" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="${nameSize}" fill="${C.ink}">${name}</text>
  <text x="600" y="424" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="${C.gray}">спроведе правна проверка на усогласеност како работодавач</text>

  <text x="600" y="502" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="${C.gray}" letter-spacing="1">РЕЈТИНГ</text>
  <circle cx="600" cy="566" r="50" fill="${C.brand}"/>
  <circle cx="600" cy="566" r="50" fill="none" stroke="${C.gold}" stroke-width="4"/>
  <text x="600" y="583" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="40" fill="${C.paper}">${esc(tier)}</text>
  ${ratingLabel ? `<text x="600" y="648" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" fill="${C.ink}">${esc(ratingLabel)}</text>` : ''}

  <text x="600" y="726" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="${C.gray}">Издадено: ${issued}  ·  Важи до: ${expires}${verified ? '  ·  верификувана компанија' : ''}</text>
  <text x="600" y="752" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="${C.brand}">Проверете на nexa.mk/badge/${esc(token || '')}</text>
  <text x="600" y="792" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="${C.gray}">Информативна самопроценка — не претставува правна заверка или гаранција за усогласеност.</text>
</svg>`;
}

/**
 * Render the certificate as a real PDF (A4 landscape) into a writable stream.
 * Uses the bundled DejaVuSans fonts (full Cyrillic). Centered/symmetric layout
 * with the company name measured and shrunk to fit — mirrors certificateSVG.
 */
function certificatePDF(stream, { companyName, tier = 'A', ratingLabel = '', issuedAt, expiresAt, token, verified = false } = {}) {
  const PDFDocument = require('pdfkit');
  const path = require('path');
  const FONT = path.join(__dirname, '..', 'fonts', 'DejaVuSans.ttf');
  const FONT_B = path.join(__dirname, '..', 'fonts', 'DejaVuSans-Bold.ttf');

  const W = 842, H = 595; // A4 landscape (pt)
  const doc = new PDFDocument({ size: [W, H], margin: 0 });
  doc.registerFont('mk', FONT);
  doc.registerFont('mkb', FONT_B);
  doc.pipe(stream);

  const cx = W / 2;
  const name = companyName || 'Вашата компанија';
  const issued = fmtDate(issuedAt);
  const expires = fmtDate(expiresAt);

  // Centered line helper (top of text at y).
  const line = (t, y, size, font, color, spacing = 0) => {
    doc.font(font).fontSize(size).fillColor(color);
    doc.text(t, 0, y, { width: W, align: 'center', characterSpacing: spacing });
  };

  // Symmetric borders.
  doc.lineWidth(3).strokeColor(C.gold).rect(20, 20, W - 40, H - 40).stroke();
  doc.lineWidth(1).strokeColor(C.brand).rect(30, 30, W - 60, H - 60).stroke();

  line('N E X A', 56, 21, 'mkb', C.brand, 4);
  line('ПРОВЕРЕН РАБОТОДАВАЧ', 92, 25, 'mkb', C.ink, 1);
  line('Потврда за спроведена правна проверка (самопроценка)', 130, 11, 'mk', C.gray);
  doc.moveTo(cx - 120, 158).lineTo(cx + 120, 158).lineWidth(1).strokeColor(C.soft).stroke();

  line('СЕ ПОТВРДУВА ДЕКА', 196, 10.5, 'mk', C.gray, 1);
  // Fit the company name to the inner width.
  let nameSize = 30;
  doc.font('mkb');
  while (nameSize > 14 && doc.fontSize(nameSize).widthOfString(name) > W - 150) nameSize -= 1;
  line(name, 224, nameSize, 'mkb', C.ink);
  line('спроведе правна проверка на усогласеност како работодавач', 266, 11, 'mk', C.gray);

  line('РЕЈТИНГ', 322, 10.5, 'mk', C.gray, 1);
  const medY = 388;
  doc.circle(cx, medY, 34).fillColor(C.brand).fill();
  doc.circle(cx, medY, 34).lineWidth(3).strokeColor(C.gold).stroke();
  doc.font('mkb').fontSize(26).fillColor(C.paper).text(tier, 0, medY - 15, { width: W, align: 'center' });
  if (ratingLabel) line(ratingLabel, medY + 38, 12, 'mk', C.ink);

  line(`Издадено: ${issued}   ·   Важи до: ${expires}${verified ? '   ·   верификувана компанија' : ''}`, 500, 10.5, 'mk', C.gray);
  line(`Проверете на nexa.mk/badge/${token || ''}`, 520, 10, 'mk', C.brand);
  line('Информативна самопроценка — не претставува правна заверка или гаранција за усогласеност.', 548, 8.5, 'mk', C.gray);

  doc.end();
  return doc;
}

module.exports = {
  ratingForScore,
  BADGE_MIN_SCORE,
  generateToken,
  sealSVG,
  certificateSVG,
  certificatePDF,
  COLORS: C,
};

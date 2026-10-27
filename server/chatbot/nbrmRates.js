/**
 * Official NBRM (National Bank of North Macedonia) exchange rates for Дина.
 *
 * When an accounting question mentions a foreign currency (or exchange rates in
 * general), ChatBotService appends a short block with the official NBRM middle
 * rates to Дина's prompt prefix, so conversions use the real daily rate
 * instead of a guessed one. Free public JSON service, no key:
 *   https://www.nbrm.mk/KLServiceNOV/GetExchangeRate?StartDate=dd.MM.yyyy&EndDate=dd.MM.yyyy&format=json
 * Failures are silent (returns '') — the answer just goes without live rates.
 */

const NBRM_URL = 'https://www.nbrm.mk/KLServiceNOV/GetExchangeRate';
const CACHE_TTL_MS = 60 * 60 * 1000; // rates are published once per working day
const TIMEOUT_MS = 4000;
const LOOKBACK_DAYS = 7; // covers weekends/holidays (no new list on those days)

// Currency code → Cyrillic/Latin mention patterns. JS \b is ASCII-only, so the
// Cyrillic stems are matched as plain substrings (they don't occur in unrelated words).
const CURRENCY_PATTERNS = Object.freeze({
  EUR: /\bEUR\b|евр|€/i,
  USD: /\bUSD\b|долар|\$/i,
  GBP: /\bGBP\b|фунт|£/i,
  CHF: /\bCHF\b|франк|франц|швајцарск/i,
  RSD: /\bRSD\b|динар/i,
  BGN: /\bBGN\b|бугарск/i,
  TRY: /\bTRY\b|лира|лири/i,
  SEK: /\bSEK\b|шведск/i,
  NOK: /\bNOK\b|норвешк/i,
  DKK: /\bDKK\b|данск/i,
  CAD: /\bCAD\b|канадск/i,
  AUD: /\bAUD\b|австралиск/i,
  JPY: /\bJPY\b|јапонск/i,
  CNY: /\bCNY\b|јуан|кинеск/i,
});
const GENERIC_FX = /курс|девиз|валут|странск|exchange rate/i;
const DEFAULT_CODES = ['EUR', 'USD', 'GBP', 'CHF'];

let cache = { at: 0, rates: null };

const pad = (n) => String(n).padStart(2, '0');
const fmtQuery = (d) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
const fmtHuman = (iso) => {
  const d = new Date(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
};

/** Which currency codes the text asks about ([] when no FX intent). */
function detectCurrencies(text) {
  const t = String(text || '');
  const codes = Object.keys(CURRENCY_PATTERNS).filter((c) => CURRENCY_PATTERNS[c].test(t));
  if (codes.length) return codes;
  return GENERIC_FX.test(t) ? DEFAULT_CODES : [];
}

/** Latest NBRM list as { date, byCode: { EUR: { rate, nomin, name } } }, or null. */
async function fetchLatestRates() {
  if (cache.rates && Date.now() - cache.at < CACHE_TTL_MS) return cache.rates;
  const end = new Date();
  const start = new Date(end.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const url = `${NBRM_URL}?StartDate=${fmtQuery(start)}&EndDate=${fmtQuery(end)}&format=json`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('empty list');
    const latest = rows.reduce((max, r) => (r.datum > max ? r.datum : max), rows[0].datum);
    const byCode = {};
    for (const r of rows) {
      if (r.datum !== latest) continue;
      byCode[r.oznaka] = { rate: r.sreden, nomin: r.nomin || 1, name: r.nazivMak };
    }
    cache = { at: Date.now(), rates: { date: latest, byCode } };
    return cache.rates;
  } catch (e) {
    console.warn('[nbrm] exchange rate fetch failed:', e.message);
    return cache.rates; // stale-but-official beats nothing
  }
}

/**
 * Prompt block with official NBRM middle rates for the currencies the text
 * mentions; '' when there is no FX intent or the service is unavailable.
 */
async function nbrmRatesBlock(text) {
  const codes = detectCurrencies(text);
  if (codes.length === 0) return '';
  const rates = await fetchLatestRates();
  if (!rates) return '';
  const lines = codes
    .filter((c) => rates.byCode[c])
    .map((c) => {
      const { rate, nomin, name } = rates.byCode[c];
      return `- ${nomin} ${c} (${name}) = ${String(rate).replace('.', ',')} денари`;
    });
  if (lines.length === 0) return '';
  return (
    `# ОФИЦИЈАЛЕН КУРС НА НБРМ (среден курс, курсна листа од ${fmtHuman(rates.date)})\n` +
    lines.join('\n') +
    '\nЗа пресметки во странска валута користи ГИ ОВИЕ курсеви и наведи го датумот на курсната листа. ' +
    'За сметководствено евидентирање важи средниот курс на НБРМ на денот на трансакцијата — ако корисникот прашува за друг датум, кажи дека курсот за тој ден се проверува на nbrm.mk. ' +
    'Не измислувај курс за валута што ја нема тука.\n\n'
  );
}

module.exports = { nbrmRatesBlock, detectCurrencies };

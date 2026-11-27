// „Понуда" — shared helpers for the quote editor, list and public page.
// computeTotals mirrors server/services/salesQuotesService.js (the server is
// the source of truth; this is for live totals while typing).

export const VAT_RATES = [18, 10, 5, 0];
// Standard invoice abbreviations (read correctly after any number: „30 ком.").
export const UNITS = [
  { v: 'ком.', l: 'ком. (парче)' }, { v: 'ч.', l: 'ч. (час)' }, { v: 'дн.', l: 'дн. (ден)' },
  { v: 'мес.', l: 'мес. (месец)' }, { v: 'усл.', l: 'усл. (услуга)' }, { v: 'пак.', l: 'пак. (пакет)' },
  { v: 'кг', l: 'кг' }, { v: 'м²', l: 'м²' }, { v: 'м', l: 'м' }, { v: 'л', l: 'л' },
];
export const PAYMENT_TERMS = [
  'Авансно, во рок од 7 дена од прифаќање',
  '50% аванс, 50% по испорака',
  'Во рок од 15 дена од фактура',
  'Во рок од 30 дена од фактура',
  'Во готово при испорака',
];
export const DELIVERY_TERMS = [
  'Во рок од 7 дена од прифаќање',
  'Во рок од 15 дена од прифаќање',
  'Во рок од 30 дена од прифаќање',
  'По договор',
];

export const STATUS = {
  draft:    { label: 'Нацрт',     tone: 'neutral' },
  sent:     { label: 'Испратена', tone: 'info' },
  viewed:   { label: 'Отворена',  tone: 'info' },
  accepted: { label: 'Прифатена', tone: 'success' },
  declined: { label: 'Одбиена',   tone: 'danger' },
  expired:  { label: 'Истечена',  tone: 'muted' },
};

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const n = (v) => { const x = Number(String(v ?? '').replace(',', '.')); return Number.isFinite(x) ? x : 0; };

export function computeTotals(items = [], discountPct = 0) {
  const d = Math.min(100, Math.max(0, n(discountPct))) / 100;
  let subtotal = 0; let net = 0; const vatBy = {};
  let costNet = 0; let cost = 0; let costLines = 0; let named = 0;
  for (const it of items) {
    if (!String(it.name || '').trim()) continue;
    named += 1;
    const line = n(it.qty) * n(it.price);
    const lineNet = line * (1 - d);
    const rate = Number(it.vat);
    subtotal += line; net += lineNet;
    vatBy[rate] = (vatBy[rate] || 0) + lineNet * (rate / 100);
    if (it.cost !== '' && it.cost !== null && it.cost !== undefined) {
      costNet += lineNet; cost += n(it.qty) * n(it.cost); costLines += 1;
    }
  }
  const vat = Object.values(vatBy).reduce((a, b) => a + b, 0);
  return {
    subtotal: round2(subtotal),
    discount: round2(subtotal - net),
    net: round2(net),
    vatBreakdown: Object.keys(vatBy).map(Number).sort((a, b) => b - a).map((rate) => ({ rate, amount: round2(vatBy[rate]) })),
    vat: round2(vat),
    total: round2(net + vat),
    margin: costLines && costNet > 0
      ? { lines: costLines, allLines: costLines === named, cost: round2(cost), profit: round2(costNet - cost), pct: round2(((costNet - cost) / costNet) * 100) }
      : null,
  };
}

export function money(amount, currency = 'MKD') {
  const v = Number(amount || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency === 'EUR' ? `${v} €` : `${v} ден.`;
}

export function fmtDay(d) {
  if (!d) return '';
  const x = new Date(d);
  if (isNaN(x)) return '';
  return `${String(x.getDate()).padStart(2, '0')}.${String(x.getMonth() + 1).padStart(2, '0')}.${x.getFullYear()}`;
}

export function daysSince(d) {
  if (!d) return null;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

export const quoteUrl = (token) => `${window.location.origin}/ponuda/${token}`;

/** Question for Борис (business consultant) — opens his chat pre-filled. */
export function borisQuestion(q, totals) {
  const lines = (q.items || []).filter((it) => String(it.name || '').trim()).slice(0, 10).map((it) => {
    const c = it.cost !== '' && it.cost !== null && it.cost !== undefined ? `, мој трошок ${it.cost}` : '';
    return `- ${it.name}: ${it.qty} ${it.unit} × ${it.price} (ДДВ ${it.vat}%${c})`;
  });
  const cur = q.currency === 'EUR' ? '€' : 'ден.';
  return [
    `Проверете ја мојата понуда пред да ја испратам (цените се без ДДВ, во ${cur}):`,
    ...lines,
    q.discountPct ? `Попуст на целата понуда: ${q.discountPct}%.` : 'Без попуст.',
    `Вкупно без ДДВ: ${totals.net} ${cur}.`,
    totals.margin ? `Мојата маржа според трошоците: ${totals.margin.pct}%.` : 'Трошоците не ги внесов.',
    'Дали цената и маржата држат, што ме чини попустот и што би сменил пред да ја испратам?',
  ].join('\n');
}

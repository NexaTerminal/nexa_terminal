/**
 * Arithmetic guard for Борис (business consultant).
 *
 * Language models occasionally slip on arithmetic; a consultant with a wrong
 * sum loses all credibility. This finds written equations in an answer —
 * "280.000 ÷ 800 = 350", "(130−100)÷130 = 23,1%", "2.080×35 − 97.000 = −24.200",
 * "1 ÷ 0,04 ≈ 25" — recomputes the left side and, when the stated result is
 * clearly wrong, replaces it with the correct value in the same number style.
 *
 * Number style is Macedonian: "." thousands, "," decimals ("1.500", "0,30").
 * A dot is a decimal point only when NOT followed by exactly three digits
 * ("2.5%", "0.04"). Conservative by design: anything it cannot parse
 * unambiguously is left untouched.
 */

const NUM = String.raw`[+\-−]?\d{1,3}(?:\.\d{3})+(?:,\d+)?|[+\-−]?\d+(?:[.,]\d+)?`;
const UNIT = String.raw`\s*(?:%|ден\.?|денари|€|eur|EUR)?`;
// An expression: number (op number)+ with optional parentheses and units.
const EXPR = String.raw`(?:\(\s*)*(?:${NUM})${UNIT}(?:\s*\)*\s*[÷×x*/+\-−]\s*(?:\(\s*)*(?:${NUM})${UNIT}\s*\)*)+`;
// A chain of segments joined by "=" / "≈"; each segment is an expression or a number.
const SEG = String.raw`(?:${EXPR}|(?:${NUM})${UNIT})`;
const CHAIN = new RegExp(String.raw`${SEG}(?:\s*(?:=|≈)\s*${SEG})+`, 'g');

function parseNum(raw) {
  let s = String(raw).replace(/−/g, '-').replace(/^\+/, '').trim();
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function decimalsOf(raw) {
  const s = String(raw);
  if (/^[+\-−]?\d{1,3}(\.\d{3})+$/.test(s)) return 0;
  const m = s.match(/[.,](\d+)$/);
  if (!m) return 0;
  return /\.\d{3}$/.test(s) && !/,/.test(s) ? 0 : m[1].length;
}

/** Format like the author did: MK style unless they used a plain dot decimal. */
function formatLike(value, rawResult) {
  const dec = Math.min(decimalsOf(rawResult), 3);
  const sign = value < 0 ? (/^−/.test(rawResult) ? '−' : '-') : (/^\+/.test(rawResult) ? '+' : '');
  const abs = Math.abs(value);
  const fixed = abs.toFixed(dec);
  const [int, frac] = fixed.split('.');
  const usesMkThousands = /\d\.\d{3}/.test(rawResult) || abs >= 10000;
  const intFmt = usesMkThousands ? int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : int;
  const decSep = /\d\.\d{1,2}$/.test(rawResult) && !/\d\.\d{3}/.test(rawResult) ? '.' : ',';
  return sign + intFmt + (frac ? decSep + frac : '');
}

/** Evaluate a token list with standard precedence; percent operands → fraction when mixed. */
function evaluate(exprText) {
  const tokens = [];
  const re = new RegExp(String.raw`\s*(?:(${NUM})(\s*%)?${String.raw`(?:\s*(?:ден\.?|денари|€|eur|EUR))?`}|([÷×x*/+\-−()]))`, 'gy');
  let m;
  let pos = 0;
  while (pos < exprText.length) {
    re.lastIndex = pos;
    m = re.exec(exprText);
    if (!m || m.index !== pos) {
      if (/^\s+$/.test(exprText.slice(pos))) break;
      return null;
    }
    pos = re.lastIndex;
    if (m[1] !== undefined) {
      // A leading "-"/"−" right after a number is a binary minus, not a sign.
      const prev = tokens[tokens.length - 1];
      if (/^[\-−+]/.test(m[1]) && prev && (prev.t === 'n' || prev.v === ')')) {
        tokens.push({ t: 'op', v: '-' === m[1][0] || '−' === m[1][0] ? '-' : '+' });
        const n = parseNum(m[1].slice(1));
        if (n === null) return null;
        tokens.push({ t: 'n', v: n, pct: !!m[2] });
      } else {
        const n = parseNum(m[1]);
        if (n === null) return null;
        tokens.push({ t: 'n', v: n, pct: !!m[2] });
      }
    } else {
      const op = m[3] === '×' || m[3] === 'x' || m[3] === '*' ? '*' : m[3] === '÷' || m[3] === '/' ? '/' : m[3] === '−' ? '-' : m[3];
      tokens.push({ t: 'op', v: op });
    }
  }
  if (!tokens.length) return null;
  // Percent operands: "8% ÷ (35% + 8%)" → use the raw numbers (ratio is the same);
  // "381 × 2.5%" (mixed) → treat % as a fraction.
  const nums = tokens.filter((t) => t.t === 'n');
  const allPct = nums.every((t) => t.pct);
  for (const t of nums) if (t.pct && !allPct) t.v = t.v / 100;

  let i = 0;
  const peek = () => tokens[i];
  const factor = () => {
    const t = tokens[i++];
    if (!t) throw new Error('eof');
    if (t.t === 'n') return t.v;
    if (t.v === '(') { const v = expr(); if (tokens[i++]?.v !== ')') throw new Error('paren'); return v; }
    if (t.v === '-') return -factor();
    throw new Error('bad');
  };
  const term = () => {
    let v = factor();
    while (peek() && (peek().v === '*' || peek().v === '/')) {
      const op = tokens[i++].v; const r = factor();
      v = op === '*' ? v * r : v / r;
    }
    return v;
  };
  const expr = () => {
    let v = term();
    while (peek() && (peek().v === '+' || peek().v === '-')) {
      const op = tokens[i++].v; const r = term();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  };
  try {
    const v = expr();
    if (i !== tokens.length || !Number.isFinite(v)) return null;
    return { value: v, allPct };
  } catch {
    return null;
  }
}

function matches(stated, computed, approx) {
  const tol = approx ? 0.05 : 0.015;
  if (stated === computed) return true;
  const diff = Math.abs(stated - computed);
  if (diff <= 0.51 && Math.abs(computed) >= 5) return true; // rounding to whole units
  return diff / Math.max(Math.abs(computed), 1e-9) <= tol;
}

/**
 * Check and correct equations in `text`. Chains ("a×b − c = d − c = e") are
 * checked step by step; only a plain-number segment that disagrees with the
 * previous segment is corrected (an expression segment is never rewritten).
 * @returns {{ text: string, checked: number, fixed: Array<{expr:string, stated:string, correct:string}> }}
 */
function checkMath(text) {
  const fixed = [];
  let checked = 0;
  const src = String(text || '');
  const out = src.replace(CHAIN, (whole, offset) => {
    // Ranges ("444 × 0,35 … 444 × 0,60 = 155 … 266") pair the wrong sides — skip.
    const before = src.slice(Math.max(0, offset - 4), offset);
    const after = src.slice(offset + whole.length, offset + whole.length + 4);
    if (/…|\.\.\.|\s[–-]\s?$/.test(before) || /^\s?(…|\.\.\.|[–-]\s)/.test(after)) return whole;
    // Split into segments, keeping the separators.
    const parts = whole.split(/(\s*(?:=|≈)\s*)/);
    const segs = parts.filter((_, k) => k % 2 === 0);
    const seps = parts.filter((_, k) => k % 2 === 1);
    // Need at least one real expression in the chain.
    if (!segs.some((sg) => /\d\s*(?:%|ден\.?|денари|€|eur|EUR)?\s*\)*\s*[÷×x*/+\-−]\s*\(*\s*[+\-−]?\d/.test(sg))) return whole;
    const evals = segs.map((sg) => evaluate(sg.replace(/\s*(?:ден\.?|денари|€|eur|EUR)\s*$/, '')));
    if (evals.some((e) => !e)) return whole;
    let changed = false;
    for (let k = 1; k < segs.length; k++) {
      const prev = evals[k - 1];
      const cur = segs[k].trim();
      const plain = new RegExp(String.raw`^(${NUM})(\s*(?:%|ден\.?|денари|€))?$`).exec(cur);
      const approx = /≈/.test(seps[k - 1]);
      let target = prev.value;
      if (plain) {
        const stated = parseNum(plain[1]);
        const isPct = /%/.test(plain[2] || '');
        if (isPct && !prev.allPct && Math.abs(target) <= 10 && !matches(stated, target, approx)) target *= 100;
        checked++;
        if (!matches(stated, target, approx)) {
          const correct = formatLike(target, plain[1]);
          fixed.push({ expr: segs[k - 1].trim(), stated: plain[1], correct });
          segs[k] = segs[k].replace(plain[1], correct);
          evals[k] = { value: target, allPct: prev.allPct };
          changed = true;
        }
      } else {
        checked++; // expression vs expression: verify only, never rewrite
      }
    }
    if (!changed) return whole;
    let rebuilt = segs[0];
    for (let k = 1; k < segs.length; k++) rebuilt += seps[k - 1] + segs[k];
    return rebuilt;
  });
  return { text: out, checked, fixed };
}

module.exports = { checkMath, _internal: { parseNum, evaluate, formatLike } };

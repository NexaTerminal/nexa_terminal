const { Document, Paragraph, TextRun, AlignmentType, PageBreak, Table, TableRow, TableCell, WidthType } = require('docx');
const moment = require('moment');

/**
 * Намалување на основна главнина (Централен регистар) — phase-by-phase generator.
 *
 * Capital reduction under чл. 261–263 ЗТД is a statutory TWO-PHASE process with a
 * creditor-protection window in between. The user picks ONE phase per generation
 * (formData.phase = '1' | '2'); only that phase's documents are produced, dated by the
 * phase's own date field (default today):
 *
 *   ФАЗА I — Намера (dated phase1Date):
 *     Д-01 Одлука за намера за намалување (чл. 261/262/263)
 *     (Д-PD Одлука за промена на лични податоци — optional companion)
 *     Д-07 Изјава за потписи (чл. 7) — по потписник
 *     Д-08 Полномошно — по потписник
 *
 *   ФАЗА II — Спроведување (dated phase2Date):
 *     Д-02 Одлука за намалување на основната главнина (чл. 261 ст.1)
 *     (Д-PD Одлука за промена на лични податоци — optional companion)
 *     Д-03 Изјава (Управител) по чл. 263 ст.3 — creditor statement (2 variants)
 *     Д-04 Изјава по член 32 (action list)
 *     Д-05 Договор (ДОО) / Изјава (ДООЕЛ) за основање — пречистен текст
 *     Д-06 Одлука за измена на Актот за основање (чл. 252/253)
 *     Д-09 Книга на удели
 *     Д-10 Полномошно (управител)
 *
 * Amounts are in MKD (денари), entered per shareholder as plain integers; totals and
 * the reduction are derived. Source wording: 298-SNH Invest templates (both phases).
 * Architecture mirrors companyChanges.js (build* helpers → array of Paragraphs).
 */

const FONT = 'Times New Roman';
const LINE = 276;

// ---------------------------------------------------------------------------
// Low-level paragraph helpers (same conventions as companyChanges.js)
// ---------------------------------------------------------------------------

function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text: text || '', bold: opts.bold, italics: opts.italics, font: FONT, size: opts.size || 24 })],
    alignment: opts.align || AlignmentType.JUSTIFIED,
    spacing: { after: opts.after != null ? opts.after : 200, line: LINE }
  });
}

function title(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, font: FONT, size: opts.size || 24 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: opts.after != null ? opts.after : 200, line: LINE }
  });
}

function sectionHeader(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, font: FONT, size: 24 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 120, line: LINE }
  });
}

function article(n) {
  return new Paragraph({
    children: [new TextRun({ text: `Член ${n}`, bold: true, font: FONT, size: 24 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 100, line: LINE }
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

/** Signature line + name(s) under it, left aligned (MASTER §4.3). */
function signature({ roleLabel, lines = [] }) {
  const out = [];
  if (roleLabel) {
    out.push(new Paragraph({
      children: [new TextRun({ text: roleLabel, bold: true, font: FONT, size: 24 })],
      alignment: AlignmentType.LEFT,
      spacing: { before: 300, after: 120, line: LINE }
    }));
  }
  out.push(new Paragraph({
    children: [new TextRun({ text: '___________________________', font: FONT, size: 24 })],
    alignment: AlignmentType.LEFT,
    spacing: { after: 0, line: LINE }
  }));
  lines.filter(Boolean).forEach((ln, i) => {
    out.push(new Paragraph({
      children: [new TextRun({ text: ln, font: FONT, size: 24 })],
      alignment: AlignmentType.LEFT,
      spacing: { after: i === lines.length - 1 ? 300 : 0, line: LINE }
    }));
  });
  return out;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function fmtDate(value) {
  return value ? moment(value).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
}

function joinAnd(items) {
  const arr = items.filter(Boolean);
  if (arr.length === 0) return '';
  if (arr.length === 1) return arr[0];
  return arr.slice(0, -1).join(', ') + ' и ' + arr[arr.length - 1];
}

// MKD amounts ----------------------------------------------------------------

const ONES_M = ['', 'еден', 'два', 'три', 'четири', 'пет', 'шест', 'седум', 'осум', 'девет'];
const ONES_F = ['', 'една', 'две', 'три', 'четири', 'пет', 'шест', 'седум', 'осум', 'девет'];
const TEENS = ['десет', 'единаесет', 'дванаесет', 'тринаесет', 'четиринаесет', 'петнаесет', 'шеснаесет', 'седумнаесет', 'осумнаесет', 'деветнаесет'];
const TENS = ['', '', 'дваесет', 'триесет', 'четириесет', 'педесет', 'шеесет', 'седумдесет', 'осумдесет', 'деведесет'];
const HUNDREDS = ['', 'сто', 'двесте', 'триста', 'четиристотини', 'петстотини', 'шестотини', 'седумстотини', 'осумстотини', 'деветстотини'];

/** Parses a user-entered MKD amount ("1.500.000,00" or "1500000") to an integer. */
function parseMKD(v) {
  if (v == null) return 0;
  const intPart = String(v).split(',')[0].replace(/\D/g, '');
  return parseInt(intPart || '0', 10) || 0;
}

/** "13.500.000,00" — grouped thousands with ,00 decimals. */
function formatMKD(n) {
  const num = Math.floor(Math.abs(Number(n) || 0));
  return num.toLocaleString('de-DE') + ',00';
}

function threeDigits(n, fem) {
  const o = fem ? ONES_F : ONES_M;
  const parts = [];
  const h = Math.floor(n / 100);
  const rem = n % 100;
  if (h) parts.push(HUNDREDS[h]);
  if (rem >= 10 && rem <= 19) parts.push(TEENS[rem - 10]);
  else {
    const t = Math.floor(rem / 10);
    const u = rem % 10;
    const td = [];
    if (t) td.push(TENS[t]);
    if (u) td.push(o[u]);
    parts.push(td.join(' и '));
  }
  return parts.filter(Boolean).join(' ');
}

/** Macedonian cardinal in words (feminine илјади, masculine милиони/денари). */
function mkdWords(num) {
  const n = Math.floor(Math.abs(Number(num) || 0));
  if (n === 0) return 'нула';
  const milliards = Math.floor(n / 1000000000);
  const millions = Math.floor((n % 1000000000) / 1000000);
  const thousands = Math.floor((n % 1000000) / 1000);
  const base = n % 1000;
  const groups = [];
  if (milliards) groups.push(threeDigits(milliards, false) + (milliards === 1 ? ' милијарда' : ' милијарди'));
  if (millions) groups.push(threeDigits(millions, false) + (millions === 1 ? ' милион' : ' милиони'));
  if (thousands) groups.push(threeDigits(thousands, true) + (thousands === 1 ? ' илјада' : ' илјади'));
  if (base) groups.push(threeDigits(base, false));
  if (groups.length === 1) return groups[0];
  return groups.slice(0, -1).join(' ') + ' и ' + groups[groups.length - 1];
}

/** "13.500.000,00 денари (тринаесет милиони и петстотини илјади денари)" */
function mkdFull(n) {
  return `${formatMKD(n)} денари (${mkdWords(n)} денари)`;
}

// ---------------------------------------------------------------------------
// Domain helpers — company & person identification
// ---------------------------------------------------------------------------

function resolveCompany(formData, company) {
  return {
    fullName: formData.companyFullName || company?.companyName || '[Назив на друштвото]',
    shortName: formData.companyShortName || company?.companyName || '[Скратен назив]',
    foreignName: formData.companyForeignName || '',
    form: (formData.companyForm || 'doo').toLowerCase(),
    address: formData.companyAddress || company?.companyAddress || company?.address || '[Адреса на седиште]',
    embs: formData.companyEMBS || '[ЕМБС]',
    edb: formData.companyEDB || company?.companyTaxNumber || company?.taxNumber || '',
    activityCode: formData.companyActivityCode || '[шифра]',
    activityText: formData.companyActivityText || '[опис на дејноста]'
  };
}

/** Company identification used in decision preambles (with „Друштвото"). */
function companyIdent(co, { withEDB = false } = {}) {
  let s = `${co.fullName}, со седиште на ${co.address}, Република Северна Македонија, со ЕМБС ${co.embs}`;
  if (withEDB && co.edb) s += ` и ЕДБ ${co.edb}`;
  s += ' (во понатамошниот текст: „Друштвото")';
  return s;
}

/**
 * Textual identification of a person.
 * state: 'current' (use address) | 'new' (use newAddress||address) |
 *        'transition' (show "address (нова адреса: newAddress)" when a new one exists).
 */
function pPerson(person, state = 'current') {
  if (!person) return '[лице]';
  const name = person.name || '[Име и презиме]';
  if (person.entityType === 'legal') {
    return `${name}, со седиште на ${person.address || '[адреса]'}, со ЕМБС/рег. број ${person.idNumber || '[број]'}`;
  }
  let addr = person.address || '[адреса]';
  if (state === 'new' && person.newAddress) addr = person.newAddress;
  else if (state === 'transition' && person.newAddress) addr = `${person.address || '[адреса]'} (нова адреса: ${person.newAddress})`;
  if (person.isForeign === true || person.isForeign === 'да' || person.isForeign === 'yes') {
    return `${name}, државјанин на ${person.citizenship || '[држава]'}, со број на пасош ${person.idNumber || '[пасош]'}, со адреса на живеење: ${addr}`;
  }
  return `${name}, со живеалиште на адреса: ${addr}, со ЕМБГ ${person.idNumber || '[ЕМБГ]'}`;
}

/** Preamble shareholder list; `single` collapses to the sole content for ДООЕЛ. */
function shareholderRoster(shareholders, state) {
  return joinAnd(shareholders.map((s) => pPerson(s, state)));
}

/** Decision preamble opener shared by phase decisions. */
function decisionPreamble(co, shareholders, date, { intro, state = 'current', withEDB = false }) {
  const ident = companyIdent(co, { withEDB });
  const lead = intro || 'Врз основа на одредбите од Законот за трговските друштва, како и одредбите на Актот за основање на';
  if (co.form === 'dooel') {
    return p(`${lead} ${ident}, единствениот содружник – основач на Друштвото, и тоа лицето ${pPerson(shareholders[0], state)}, на ден ${date} година, ја донесе следната:`, { after: 240 });
  }
  return p(`${lead} ${ident}, основачите/содружниците на Друштвото и тоа: ${shareholderRoster(shareholders, state)}, на ден ${date} година, ја донесоа следната:`, { after: 240 });
}

/** Signature block for a decision signed by the shareholders. */
function shareholderSignatures(co, shareholders) {
  const label = co.form === 'dooel' ? 'ЕДИНСТВЕН СОДРУЖНИК / ОСНОВАЧ' : 'ОСНОВАЧИ / СОДРУЖНИЦИ';
  if (co.form === 'dooel') {
    return signature({ roleLabel: label, lines: [shareholders[0]?.name || '[Содружник]'] });
  }
  const out = signature({ roleLabel: label, lines: [] });
  shareholders.forEach((s) => out.push(...signature({ lines: [s.name || '[Содружник]'] })));
  return out;
}

/** Optional "ОДЛУКА БРОЈ {n} од {date}" line shown after signatures. */
function decisionNumberLine(numberValue, date) {
  if (!numberValue) return [];
  return [p(`ОДЛУКА БРОЈ ${numberValue} од ${date} година`, { after: 200, bold: true })];
}

/** Human list of procedures in this package (for statements / POA). */
function procedureNames(ctx) {
  const names = ['намалување на основната главнина на Друштвото'];
  if (ctx.hasPD) names.push('промена на лични податоци на основачите/содружниците');
  return names;
}

// ===========================================================================
// PHASE I BUILDERS
// ===========================================================================

/** Д-01 — Одлука за намера за намалување на основна главнина (чл. 261/262/263). */
function buildIntentDecision(ctx) {
  const { co, shareholders, phase1 } = ctx;
  const reduced = ctx.reducedShareholders;
  const reducedNames = joinAnd(reduced.map((s) => `содружникот ${s.name}`));
  const totalBefore = ctx.totals.current;
  const totalAfter = ctx.totals.new;
  const reduction = ctx.totals.reduction;

  const structureLines = shareholders.map((s) =>
    p(`паричен влог на содружник ${s.name}, во износ од ${mkdFull(parseMKD(s.newContributionMKD))}` + (s === shareholders[shareholders.length - 1] ? '.' : ' и'), { after: 80 }));

  const reductionDetail = reduced.map((s) => {
    const before = parseMKD(s.currentContributionMKD);
    const after = parseMKD(s.newContributionMKD);
    return `паричниот влог на содружникот ${s.name} се намалува за вкупен номинален износ од ${mkdFull(before - after)}`;
  });

  return [
    decisionPreamble(co, shareholders, phase1, { intro: 'Врз основа на одредбите од член 261, 262 и 263 од Законот за трговските друштва, како и одредбите на Актот за основање на', withEDB: true }),
    title('О Д Л У К А'),
    title('за намера за намалување на основната главнина', { after: 300 }),
    article(1),
    p(`Со оваа одлука, се изразува намера за намалување на основната главнина на Друштвото, по пат на намалување на номиналниот износ на паричниот влог на ${reducedNames}.`),
    article(2),
    p(`По исполнување на законските претпоставки, основната главнина на Друштвото запишана во Трговскиот регистар во износ од ${mkdFull(totalBefore)}, ќе биде намалена за вкупен номинален износ од ${mkdFull(reduction)}, изразени како паричен влог.`),
    p(`Намалувањето на основната главнина на Друштвото се спроведува на следниот начин: ${joinAnd(reductionDetail)}, додека номиналната вредност на паричните влогови на останатите содружници во Друштвото ќе остане непроменета.`),
    p(`По уписот на намалувањето на основната главнина во Трговскиот регистар, вкупната номинална вредност на основната главнина ќе изнесува ${mkdFull(totalAfter)}, која ќе се состои од паричните влогови на содружниците на следниот начин:`),
    ...structureLines,
    article(3),
    p(`Намалувањето на основната главнина на Друштвото се спроведува пред се поради ${ctx.formData.reductionReason || 'намален обем на работа, несоодветноста на основната главнина со капиталот на Друштвото, како и поради промени во деловните прилики на Друштвото во економскиот промет'}.`),
    article(4),
    p('Содружниците го овластуваат управителот на Друштвото или лице овластено од негова страна врз основа на издадено полномошно, да ја поднесе пријавата за упис на намалувањето на основната главнина на Друштвото во Трговскиот регистар, како и да ги направи сите потребни известувања и објави, согласно важечките закони.'),
    article(5),
    p('Оваа одлука стапува во сила со денот на нејзиното донесување и истата ќе биде запишана во трговскиот регистар при Централниот регистар на РСМ.'),
    ...shareholderSignatures(co, shareholders)
  ];
}

// ===========================================================================
// PHASE II BUILDERS
// ===========================================================================

/** Д-02 — Одлука за намалување на основната главнина (чл. 261 ст.1). */
function buildReductionDecision(ctx) {
  const { co, shareholders, phase2 } = ctx;
  const reduced = ctx.reducedShareholders;
  const reducedNames = joinAnd(reduced.map((s) => `содружникот ${s.name}`));
  const totalBefore = ctx.totals.current;
  const totalAfter = ctx.totals.new;
  const reduction = ctx.totals.reduction;

  const structureLines = shareholders.map((s, i) =>
    p(`паричен влог на содружник ${s.name}, во износ од ${mkdFull(parseMKD(s.newContributionMKD))}` + (i === shareholders.length - 1 ? '.' : ' и'), { after: 80 }));
  const reductionDetail = reduced.map((s) => {
    const before = parseMKD(s.currentContributionMKD);
    const after = parseMKD(s.newContributionMKD);
    return `паричниот влог на содружникот ${s.name} се намалува за вкупен номинален износ од ${mkdFull(before - after)}`;
  });

  return [
    decisionPreamble(co, shareholders, phase2, { intro: 'Врз основа на одредбите од член 261 став 1 од Законот за трговските друштва, како и одредбите на Актот за основање на', state: 'transition' }),
    title('О Д Л У К А'),
    title('за намалување на основната главнина', { after: 300 }),
    article(1),
    p(`Со оваа одлука се врши намалување на основната главнина на Друштвото, по пат на намалување на номиналниот износ на паричниот влог на ${reducedNames}.`),
    article(2),
    p(`Основната главнина на Друштвото запишана во Трговскиот регистар во износ од ${mkdFull(totalBefore)}, се намалува за вкупен номинален износ од ${mkdFull(reduction)}, изразени како паричен влог.`),
    p(`Намалувањето на основната главнина се спроведува на следниот начин: ${joinAnd(reductionDetail)}, додека номиналната вредност на паричните влогови на останатите содружници останува непроменета.`),
    p(`По уписот на намалувањето на основната главнина во Трговскиот регистар, вкупната номинална вредност на основната главнина ќе изнесува ${mkdFull(totalAfter)}, која ќе се состои од паричните влогови на содружниците на следниот начин:`),
    ...structureLines,
    article(3),
    p(`Намалувањето на основната главнина на Друштвото се спроведува пред се поради ${ctx.formData.reductionReason || 'намален обем на работа, несоодветноста на основната главнина со капиталот на Друштвото, како и поради промени во деловните прилики на Друштвото во економскиот промет'}.`),
    article(4),
    p('Оваа одлука има карактер на одлука за измена на Актот за основање на Друштвото во смисла на одредбите од членовите 252 и 253 од Законот за трговски друштва.'),
    p('Со донесување на оваа одлука престануваат да важат одредбите од последниот Акт за основање на Друштвото, а поради направените измени, ќе се подготви и ќе се потпише нов Акт за основање на Друштвото кој ќе ги рефлектира промените кои настанаа во Друштвото.'),
    article(5),
    p('Содружниците го овластуваат управителот на Друштвото или лице овластено од негова страна врз основа на издадено полномошно, да ја поднесе пријавата за упис на намалувањето на основната главнина на Друштвото во Трговскиот регистар, како и да ги направи сите потребни известувања и објави, согласно важечките закони.'),
    article(6),
    p('Оваа одлука стапува во сила со денот на нејзиното донесување и истата ќе биде запишана во трговскиот регистар при Централниот регистар на РСМ.'),
    ...shareholderSignatures(co, shareholders)
  ];
}

/** Д-PD — Одлука за промена на лични податоци (used in both phases when enabled). */
function buildPersonalDataDecision(ctx, date) {
  const { co, shareholders } = ctx;
  const changed = shareholders.filter((s) => s.newAddress && s.newAddress.trim());
  const roster = changed.length ? changed : shareholders;
  const newLines = roster.map((s, i) =>
    p(`${pPerson({ ...s, address: s.newAddress || s.address, newAddress: null }, 'current')}` + (i === roster.length - 1 ? '.' : ' и'), { after: 80 }));
  return [
    decisionPreamble(co, shareholders, date, { intro: 'Во согласност со одредбите од Законот за трговските друштва, како и одредбите на Актот за основање на', state: 'transition' }),
    title('О Д Л У К А'),
    title('за промена на лични податоци', { after: 300 }),
    article(1),
    p('Личните податоци на основачите/содружниците сега ќе гласат:'),
    ...newLines,
    article(2),
    p('Оваа одлука стапува во сила со денот на нејзиното донесување и истата ќе биде запишана во трговскиот регистар при Централниот регистар на РСМ.'),
    ...shareholderSignatures(co, shareholders)
  ];
}

/** Д-03 — Изјава (Управител) по чл. 263 ст.3 — creditor statement (2 variants). */
function buildManagerCreditorStatement(ctx) {
  const { co, manager, phase2, formData } = ctx;
  const gazette = formData.gazetteNumber || '[број]';
  const gazetteDate = formData.gazetteDate ? fmtDate(formData.gazetteDate) : '[датум]';
  const none = (formData.creditorStatus || 'settled') === 'none';
  const bodyText = none
    ? `Јас, долупотпишаниот ${pPerson(manager)}, во својство на Управител на Друштвото, под целосна материјална и кривична одговорност изјавувам и потврдувам дека Друштвото нема никакви познати доверители и дека за времетраењето на огласот објавен во Службен Весник на РСМ број ${gazette}, од ден ${gazetteDate} година со кој беше објавена одлуката со која Друштвото ја изрази својата намера за намалување на основна главнина, НЕ СЕ ПРИЈАВЕНИ побарувања од страна на доверителите, а кои се однесуваат кон Друштвото, односно сите побарувања на доверителите се намирени во целост пред спроведување на постапката за намалување на основната главнина на Друштвото.`
    : `Јас, долупотпишаниот ${pPerson(manager)}, во својство на Управител на Друштвото, под целосна материјална и кривична одговорност изјавувам дека за времетраењето на огласот објавен во Службен Весник на РСМ број ${gazette}, од ден ${gazetteDate} година, со кој беше објавена одлуката со која Друштвото ја изрази својата намера за намалување на основна главнина, НЕ СЕ ПРИЈАВЕНИ побарувања од страна на доверителите, а кои се однесуваат кон Друштвото, односно сите побарувања на доверителите се намирени во целост пред спроведување на постапката за намалување на основната главнина на Друштвото. Истовремено, изјавувам дека на сите познати доверители на Друштвото им е доставено известување за намерата за намалување на основната главнина на Друштвото.`;
  return [
    p(`Врз основа на член 263 став 3 од Законот за трговските друштва, како и одредбите на Актот за основање на ${companyIdent(co)}, управителот на Друштвото, лицето ${pPerson(manager)}, на ден ${phase2} година ја даде следната:`, { after: 240 }),
    title('И З Ј А В А', { after: 300 }),
    p(bodyText),
    p('Оваа изјава ја давам како доказ за електронско спроведување на постапка за упис на одлуката за намалување на основната главнина на Друштвото при Централниот регистар на Република Северна Македонија.', { after: 300 }),
    ...signature({ roleLabel: 'Управител', lines: [manager.name || '[Управител]'] })
  ];
}

/** Д-04 — Изјава по член 32 (action list). */
function buildArticle32Statement(ctx) {
  const { co, manager, phase2, formData } = ctx;
  const gazette = formData.gazetteNumber || '[број]';
  const gazetteDate = formData.gazetteDate ? fmtDate(formData.gazetteDate) : '[датум]';
  const procs = ctx.hasPD
    ? 'намалување на основната главнина, како и промена на лични податоци на основачите/содружниците'
    : 'намалување на основната главнина';
  const items = [];
  items.push('Донесена е и потпишана одлука за намалување на основната главнина на Друштвото;');
  if (ctx.hasPD) items.push('Донесена е и потпишана одлука за промена на податоците за адреса на основачите/содружниците;');
  items.push('Донесена е и потпишана одлука за измена и дополнување на Актот за основање на Друштвото согласно членовите 252 и 253 од Законот за трговските друштва;');
  items.push('Дадена е Изјава од Управителот по член 263 став 3 од Законот за трговските друштва;');
  items.push(`Обезбедена е копија од огласот во Службен Весник на РСМ бр. ${gazette} од ден ${gazetteDate} година во кој беше објавена одлуката со која Друштвото ја изрази својата намера за намалување на основната главнина;`);
  items.push('Дадена е Изјава согласно член 32 од Законот за трговските друштва;');
  items.push('Дадена е Изјава согласно член 7 став 1 алинеја 4 од Правилникот за издавање на овластување на регистрационен агент;');
  items.push('Подготвен е и потпишан пречистен текст на Актот за основање на друштвото;');
  items.push('Подготвена е Пријава заради спроведување на горенаведените промени во Трговскиот регистар при Централниот регистар на РСМ;');
  items.push('Дадени се Овластувања за преземање дејствија за сметка на друштвото пред Трговскиот регистар при Централниот регистар на РСМ.');
  return [
    p(`Во врска со постапката за ${procs} на ${companyIdent(co)}, а во согласност со одредбите на Законот за трговските друштва, ${pPerson(manager)}, како управител на Друштвото, на ден ${phase2} година ја дава следната:`, { after: 240 }),
    title('И З Ј А В А', { after: 300 }),
    p('Во врска со горенаведената постапка, како управител на Друштвото под полна морална, материјална и кривична одговорност изјавувам дека заради нејзино спроведување, преземени се следниве дејствија:', { after: 160 }),
    ...items.map((t) => p(`– ${t}`, { after: 80 })),
    p('Оваа изјава ја давам за да послужи за запишување на промените во Трговскиот регистар при Централниот регистар на Република Северна Македонија.', { after: 300 }),
    ...signature({ roleLabel: 'Изјавил', lines: [`Управител ${manager.name || '[Управител]'}`] })
  ];
}

/** Д-07 / Д-03(ф.I) — Изјава за потписи (чл. 7), по потписник. */
function buildSignatureStatement(ctx, signatory, date) {
  const { co, formData } = ctx;
  const agentName = formData.agentName || '[регистрационен агент]';
  const agentAddress = formData.agentAddress || '[адреса на агентот]';
  const procs = ctx.hasPD
    ? 'намалување на основната главнина на Друштвото, како и промена на лични податоци на основачите/содружниците'
    : 'намалување на основната главнина на Друштвото';
  return [
    p(`Врз основа на член 7 став 1 алинеа 4 од Правилникот за издавање на овластување на регистрационен агент, јас, долупотпишаниот/ата ${pPerson(signatory.person, 'transition')}, како ${signatory.capacity} на ${companyIdent(co)}, на ден ${date} година, ја давам следната:`, { after: 240 }),
    title('И З Ј А В А', { after: 300 }),
    p(`Изјавувам под полна материјална и кривична одговорност дека потписите на прилозите доставени до регистрациониот агент ${agentName}, со адреса на ${agentAddress}, во хартиена форма ги имам лично и своерачно потпишано за електронска комуникација со Централниот Регистар на РСМ и други административни работи во врска со постапката за ${procs}, како и измената на Актот за основање на Друштвото, преку системот Е-Регистрација.`, { after: 300 }),
    ...signature({ roleLabel: 'ИЗЈАВИЛ', lines: [signatory.person.name || '[Потписник]'] })
  ];
}

/** Д-08 / Д-10 — Полномошно, по потписник. phase ∈ 1|2. */
function buildPowerOfAttorney(ctx, signatory, date, phase) {
  const { co, formData } = ctx;
  const agentPersons = formData.agentPersons
    ? formData.agentPersons
    : `${formData.agentName || '[регистрационен агент]'}, со седиште на ${formData.agentAddress || '[адреса на агентот]'}`;
  const purpose = ctx.hasPD
    ? 'во постапка за намалување на основна главнина на Друштвото преку намалување на номиналниот износ на паричниот влог во основната главнина, како и постапка за промена на личните податоци на основачите/содружниците на Друштвото'
    : 'во постапка за намалување на основна главнина на Друштвото преку намалување на номиналниот износ на паричниот влог во основната главнина';

  const actions = [];
  if (phase === 1) {
    actions.push('Да донесат и потпишат Одлука за намера за намалување на основната главнина;');
    actions.push('Да ја објават намерата за намалување на основната главнина во Службен весник на Република Северна Македонија;');
  } else {
    actions.push('Да донесат и потпишат Одлука за намалување на основната главнина;');
    actions.push('Да дадат изјави согласно член 263 став 3 од Законот за трговските друштва;');
  }
  if (ctx.hasPD) actions.push('Да донесат и потпишат Одлука за промена на лични податоци на основачите/содружниците;');
  actions.push('Да донесат и потпишат Одлука за измена на Актот за основање на Друштвото;');
  actions.push('Да дадат изјава согласно член 32 од Законот за трговските друштва;');
  actions.push('Да донесат и потпишат Изјава согласно член 7 став 1 алинеја 4 од Правилникот за издавање на овластување на регистрационен агент;');
  actions.push('Да донесат и потпишат нов Акт за основање на Друштвото (пречистен текст);');
  actions.push('Да ги преземат сите потребни дејствија пред Трговскиот регистар при Централниот регистар на РСМ во својство на регистрационен агент, да ја поднесат пријавата за упис на промените и да го подигнат Решението од извршените промени;');
  actions.push('Да ги донесат, склучат, потпишат и заверат сите акти, одлуки, изјави, пријави и останати писмена и обрасци, како и');
  actions.push('Да ги преземат сите останати правни дејствија кои не се наведени, а кои се неопходни за реализација на целите за кои се издава ова полномошно.');

  return [
    title('П О Л Н О М О Ш Н О', { after: 300 }),
    p(`Јас, долупотпишаниот/ата ${pPerson(signatory.person, 'transition')}, како ${signatory.capacity} на ${companyIdent(co)}, ги овластувам ${agentPersons}, во мое име и за моја сметка да ме застапуваат, секој од нив поединечно или заедно, пред Централен регистар на РСМ, пред сите надлежни нотари, како и пред сите други правни лица и државни органи, ${purpose}.`, { after: 160 }),
    p('Заради спроведување на горенаведените цели, како и заради заштита на моите права и интереси, ополномоштените се овластени во мое име и за моја сметка да ги преземат сите правни дејствија, вклучувајќи, но не ограничувајќи се на следните:', { after: 120 }),
    ...actions.map((t) => p(`– ${t}`, { after: 60 })),
    p(`${formData.city || 'Скопје'}, ${date} година`, { after: 240 }),
    ...signature({ roleLabel: 'ВЛАСТОДАТЕЛ', lines: [signatory.person.name || '[Потписник]'] })
  ];
}

// ---------------------------------------------------------------------------
// Д-06 — Одлука за измена на Актот за основање (чл. 252/253)
// ---------------------------------------------------------------------------

function buildActAmendmentDecision(ctx) {
  const { co, shareholders, phase2, formData } = ctx;
  const refDecisions = ctx.hasPD
    ? 'Одлуката за намалување на основната главнина и Одлука за промена на лични податоци, двете'
    : 'Одлуката за намалување на основната главнина';
  const structureLines = shareholders.map((s, i) =>
    p(`Паричен влог на содружник ${s.name}, во износ од ${mkdFull(parseMKD(s.newContributionMKD))}` + (i === shareholders.length - 1 ? '.' : ''), { after: 80 }));
  const out = [
    p(`Во согласност со ${refDecisions} од ден ${phase2} година, а согласно членови 252 и 253 од Законот за трговските друштва, како и одредбите од Актот за основање на ${companyIdent(co)}, основачите/содружниците на друштвото и тоа: ${shareholderRoster(shareholders, 'transition')}, на ден ${phase2} година, ја донесоа следната:`, { after: 240 }),
    title('О Д Л У К А'),
    title('за измена на Актот за основање на Друштвото', { after: 300 }),
    article(1),
    p(`Поради измените кои настанаа во Друштвото врз основа на цитираните одлуки, а во согласност со одредбите од членовите 252 и 253 од Законот за трговските друштва, се менува ${ctx.hasPD ? 'член 2 и член 7' : 'член 7'} од Договорот за основање на друштвото.`)
  ];
  let n = 2;
  if (ctx.hasPD) {
    out.push(article(n++));
    out.push(p('По спроведување на постапката за промена на лични податоци, член 2 од Договорот за основање на друштвото ќе гласи:'));
    out.push(p('Член 2', { bold: true, align: AlignmentType.CENTER }));
    out.push(p('Основачи и содружници на Друштвото се:'));
    shareholders.forEach((s, i) => out.push(p(`${pPerson(s, 'new')}` + (i === shareholders.length - 1 ? '.' : ' и'), { after: 80 })));
  }
  out.push(article(n++));
  out.push(p('По спроведување на постапката за намалување на основна главнина, член 7 од Договорот за основање на друштвото ќе гласи:'));
  out.push(p('Член 7', { bold: true, align: AlignmentType.CENTER }));
  out.push(p(`Основната главнина на друштвото е паричен влог во вредност од ${mkdFull(ctx.totals.new)}.`));
  out.push(p('Поединечните влогови на содружниците изнесуваат:'));
  out.push(...structureLines);
  out.push(article(n++));
  out.push(p('Со донесување на оваа одлука престануваат да важат одредбите од последниот Акт за основање на Друштвото, а во согласност со одредбите од членовите 252 и 253 од Законот за трговските друштва, ќе се подготви и ќе се потпише нов Акт за основање на Друштвото кој ќе ги рефлектира промените кои настанаа во Друштвото.'));
  out.push(article(n++));
  out.push(p('Оваа одлука стапува во сила со денот на нејзиното донесување и истата ќе биде запишана во трговскиот регистар при Централниот регистар на РСМ.'));
  out.push(...shareholderSignatures(co, shareholders));
  out.push(...decisionNumberLine(formData.decisionNumber, phase2));
  return out;
}

// ---------------------------------------------------------------------------
// Д-05 — пречистен текст на Актот (ДОО Договор / ДООЕЛ Изјава)
// ---------------------------------------------------------------------------

function activityArticleBody(co) {
  return [
    p('Друштвото ќе ги извршува сите дејности утврдени со НКД (Национална класификација на дејности) освен оние за кои е потребна согласност, дозвола или друг акт на државен или на друг надлежен орган.'),
    p('Согласно законот како предмет на работење се запишува општа клаузула за бизнис. Приоритетна дејност (Главна приходна шифра) на Друштвото е:'),
    p(`${co.activityCode} – ${co.activityText}`, { bold: true }),
    p('Друштвото ќе ги извршува сите дејности во внатрешниот и надворешниот промет.')
  ];
}

function managerArticleBody(singular) {
  const subject = singular ? 'единствениот содружник' : 'собирот на содружници';
  return [
    p('Управителот е овластен да:'),
    p('– ги извршува сите акти и дејности во управувањето во интерес на друштвото и да го претставува и застапува пред трети лица;', { after: 80 }),
    p('– се грижи за уредно и во согласност со законот водење на трговските книги, го подготвува извештајот за работењето и годишните сметки и истите ги поднесува на крајот на секоја фискална година;', { after: 80 }),
    p('– донесува одлуки за внатрешна организација на друштвото, го определува вкупниот број на вработени и врши прием на нови вработени;', { after: 80 }),
    p('– покренува постапка за важни прашања за работење на друштвото и предлага решенија;', { after: 80 }),
    p('– е одговорен спрема друштвото и трети лица за работењето спротивно на одредбите на Законот и/или другите прописи и за грешките направени во управувањето;', { after: 80 }),
    p(`– има овластување да издаде полномошно и да назначи полномошник по вработување, по претходна писмена согласност на ${subject}.`)
  ];
}

/** ДООЕЛ — Изјава за основање (пречистен текст). */
function buildConsolidatedActDOOEL(ctx) {
  const { co, shareholders, manager, phase2 } = ctx;
  const sole = shareholders[0];
  return [
    p(`Во согласност со одредбите од член 167 став 1, член 170 став 2 и член 171 од Законот за трговските друштва, единствениот содружник – основачот на ${co.fullName}, со седиште на ${co.address}, со ЕМБС ${co.embs} (во понатамошниот текст: „Друштвото"), и тоа лицето ${pPerson(sole, 'new')}, на ден ${phase2} година, ја дава следната:`, { after: 240 }),
    title('И З Ј А В А'),
    title('за основање на друштво со ограничена одговорност од едно лице'),
    title('(пречистен текст)', { after: 300 }),
    sectionHeader('СОДРУЖНИК'),
    article(1),
    p('Единствен содружник и основач на друштвото е:'),
    p(pPerson(sole, 'new'), { after: 200 }),
    sectionHeader('ФИРМА И СЕДИШТЕ НА ДРУШТВОТО'),
    article(2),
    p('Друштвото ќе работи под следниот назив:'),
    p(co.fullName, { bold: true }),
    p('Скратениот назив на друштвото гласи:'),
    p(co.shortName, { bold: true }),
    article(3),
    p('Седиштето на друштвото е на адреса:'),
    p(co.address, { after: 200, bold: true }),
    sectionHeader('ПРЕДМЕТ НА РАБОТЕЊЕ НА ДРУШТВОТО'),
    article(4),
    ...activityArticleBody(co),
    sectionHeader('ВРЕМЕТРАЕЊЕ НА ДРУШТВОТО'),
    article(5),
    p('Друштвото се основа на неопределено време.'),
    sectionHeader('ОСНОВНА ГЛАВНИНА И ВЛОГ НА ЕДИНСТВЕНИОТ СОДРУЖНИК'),
    article(6),
    p(`Основната главнина на друштвото е паричен влог во вредност од ${mkdFull(ctx.totals.new)}, кој е уплатен во целост.`),
    sectionHeader('УПРАВУВАЊЕ И ЗАСТАПУВАЊЕ НА ДРУШТВОТО'),
    article(7),
    p('Со друштвото управува и го застапува управител поставен од единствениот содружник на друштвото.'),
    p('За управител на друштвото се именува:'),
    p(pPerson(manager), { bold: true }),
    p('Управителот се именува на неопределено време, со неограничени овластувања во внатрешниот и надворешниот промет. Мандатот на управителот трае се додека му трае содружничкиот однос, освен ако со одлука на единствениот содружник не е отповикан или пак управителот си поднесе оставка.'),
    article(8),
    ...managerArticleBody(true),
    sectionHeader('ПРЕСТАНОК НА ДРУШТВОТО'),
    article(9),
    p('Друштвото престанува со: одлука на единствениот содружник; одлука за присоединување, спојување или поделба; стечај на друштвото; одлука на судот и други случаи определени со закон.'),
    sectionHeader('ПРЕОДНИ И ЗАВРШНИ ОДРЕДБИ'),
    article(10),
    p('Друштвото има статус на правно лице. Изјавата стапува во сила, а друштвото се смета за основано со денот на уписот во трговскиот регистар. Секоја измена и дополнување на оваа Изјава мора да биде запишана во Трговскиот регистар.', { after: 240 }),
    p(`${ctx.formData.city || 'Скопје'}, ${phase2} година.`, { after: 200 }),
    ...signature({ roleLabel: 'ЕДИНСТВЕН СОДРУЖНИК / ОСНОВАЧ', lines: [sole.name || '[Содружник]'] })
  ];
}

/** ДОО — Договор за основање (пречистен текст). */
function buildConsolidatedActDOO(ctx) {
  const { co, shareholders, manager, phase2 } = ctx;
  const rosterLines = shareholders.map((s, i) => p(`${pPerson(s, 'new')}` + (i === shareholders.length - 1 ? '.' : ' и'), { after: 80 }));
  const contribLines = shareholders.map((s) => p(`Паричен влог на содружник ${s.name}, во износ од ${mkdFull(parseMKD(s.newContributionMKD))}.`, { after: 80 }));
  return [
    p(`Врз основа на член 22, 170, а во врска со член 171 од Законот за трговските друштва, основачите/содружниците на ${co.fullName}, со седиште на ${co.address}, Република Северна Македонија и тоа: ${shareholderRoster(shareholders, 'new')}, на ден ${phase2} година, го склучија следниот:`, { after: 240 }),
    title('Д О Г О В О Р'),
    title('за основање на друштво со ограничена одговорност'),
    title('(пречистен текст)', { after: 300 }),

    sectionHeader('ОПШТИ ОДРЕДБИ'),
    article(1),
    p('Овој Договор содржи одредби за: податоци за содружниците; назив и седиште на Друштвото; предмет на работење; времетраење; основната главнина и поединечните влогови на содружниците; книгата на удели; управување и застапување; органите на Друштвото; правата и обврските на содружниците; начинот за распределба на добивката и покривање на загубите; прокура; престанок на Друштвото и други одредби.'),

    sectionHeader('СОДРУЖНИЦИ'),
    article(2),
    p('Основачи и содружници на Друштвото се:'),
    ...rosterLines,

    sectionHeader('НАЗИВ И СЕДИШТЕ НА ДРУШТВОТО'),
    article(3),
    p('Друштвото ќе работи под следниот назив:'),
    p(co.fullName, { bold: true }),
    p('Скратениот назив на Друштвото гласи:'),
    p(co.shortName, { bold: true }),
    p('За промена на фирмата на друштвото одлучуваат содружниците.'),
    article(4),
    p('Седиштето на друштвото е на:'),
    p(co.address, { after: 200, bold: true }),

    sectionHeader('ПРЕДМЕТ НА РАБОТЕЊЕ НА ДРУШТВОТО'),
    article(5),
    ...activityArticleBody(co),

    sectionHeader('ВРЕМЕТРАЕЊЕ НА ДРУШТВОТО'),
    article(6),
    p('Друштвото се основа на неопределено време.'),

    sectionHeader('ОСНОВНА ГЛАВНИНА И ПОЕДИНЕЧНИ ВЛОГОВИ НА СОДРУЖНИЦИТЕ'),
    article(7),
    p(`Основната главнина на друштвото е паричен влог во вредност од ${mkdFull(ctx.totals.new)}.`),
    p('Поединечните влогови на содружниците изнесуваат:'),
    ...contribLines,

    sectionHeader('КНИГА НА УДЕЛИ'),
    article(8),
    p('Друштвото води книга на удели која ја ажурира Управителот. По запишувањето на друштвото во трговскиот регистар, во книгата на удели се внесуваат презимето и името, занимањето и местото на живеење на секој содружник, износот на основниот влог и посебните права и обврски што произлегуваат од него. Во книгата на удели се запишува секоја промена поврзана со уделот.'),
    article(9),
    p('Содружниците слободно располагаат со своите удели. Истите може да се пренесуваат меѓу содружниците, а и на трети лица. Во случај на пренос на удел на трети лица, првенство на купување на уделот има другиот содружник.'),

    sectionHeader('УПРАВУВАЊЕ И ЗАСТАПУВАЊЕ НА ДРУШТВОТО'),
    article(10),
    p('Со друштвото управува управител.'),
    p('За управител на Друштвото се именува:'),
    p(pPerson(manager), { bold: true }),
    p('Управителот се именува на неопределено време, со неограничени овластувања во внатрешниот и надворешниот промет. Мандатот на управителот трае се додека му трае содружничкиот однос, освен ако со одлука на собирот на содружниците не е отповикан или пак управителот си поднесе оставка.'),

    sectionHeader('ОРГАНИ НА ДРУШТВОТО'),
    article(11),
    p('Органи на друштвото се: Собир на содружници и Управител.'),
    article(12),
    p('Собирот на содружниците е највисок орган на друштвото, кој управува со работењето на друштвото и одлучува за сите работи од значење за работењето на друштвото. Собирот ги усвојува годишната сметка и финансиските извештаи; одлучува за распределбата на добивката и покривање на загубите; го избира и отповикува управителот и ја утврдува неговата награда; одобрува склучување договори над една петтина од основната главнина; одлучува за измена на овој договор и врши други работи утврдени со Законот за трговските друштва.'),
    article(13),
    p('Собирот на содружници ќе се свикува најмалку еднаш годишно, од страна на управителот, со писмена или електронска покана во која е назначен дневниот ред, најмалку 30 дена пред неговото одржување. Собирот може да се одржи и пред истекот на рокот ако се присутни сите содружници и не се противат.'),
    article(14),
    p('Содружник на собирот може да биде претставен од друг содружник или друго лице врз основа на писмено полномошно заверено кај нотар, во кое е наведен обемот на овластувањата за застапување.'),
    article(15),
    p('За одлуките кои се однесуваат на собирот на содружници, управителот води книга на одлуки.'),

    sectionHeader('УПРАВИТЕЛ НА ДРУШТВОТО'),
    article(16),
    ...managerArticleBody(false),

    sectionHeader('ПРАВА И ОБВРСКИ НА СОДРУЖНИЦИТЕ'),
    article(17),
    p('Секој содружник има право да учествува во работата на собирот и располага со гласови сразмерно на својот удел, при што се добива по еден глас за секои 100 ЕВРА основен влог според среден курс на Народна банка на РСМ. Секој содружник има право на учество во управувањето и во распределбата на добивката и е должен да го одржува преземениот влог. Доколку основната главнина се намали под износот од член 7, содружниците имаат обврска да извршат доплата сразмерно на својот удел во рок од 15 дена; во спротивно тоа е основ за исклучување од друштвото.'),

    sectionHeader('НАЧИН НА РАСПРЕДЕЛБА НА ДОБИВКАТА И ПОКРИВАЊЕ НА ЗАГУБИТЕ'),
    article(18),
    p('Содружниците имаат право на учество во добивката која се утврдува според билансот на успехот и се дели сразмерно на процентот на учеството во основната главнина. Содружниците можат со одлука дел од добивката да искористат за зголемување на основната главнина.'),
    article(19),
    p('Загубата на друштвото ќе ја покриваат содружниците, соодветно на нивните основни влогови.'),

    sectionHeader('ПРОКУРА'),
    article(20),
    p('Секој прокурист мора поединечно да биде назначен од содружниците на друштвото. Прокуристот може да го застапува друштвото во постапките пред управните и другите државни органи, организациите и установите со јавни овластувања и судовите, како и со трети лица во редовниот правен промет. Назначувањето, ограничувањата и отповикувањето го вршат содружниците на предлог на управителот.'),

    sectionHeader('ПРЕСТАНОК И ЗАВРШНИ ОДРЕДБИ'),
    article(21),
    p('Друштвото престанува со: одлука на содружниците; одлука за присоединување, спојување или поделба; стечај на друштвото; одлука на судот и други случаи определени со закон. Друштвото има статус на правно лице и за обврските во правниот промет со трети лица одговара со целокупниот имот. Договорот стапува во сила, а друштвото се смета за основано со денот на уписот во трговскиот регистар, а секоја измена мора да биде запишана во Трговскиот регистар.', { after: 240 }),

    p(`${ctx.formData.city || 'Скопје'}, ${phase2} година.`, { after: 200 }),
    ...signature({ roleLabel: 'СОДРУЖНИЦИ', lines: [] }),
    ...shareholders.flatMap((s) => signature({ lines: [s.name || '[Содружник]'] }))
  ];
}

// ---------------------------------------------------------------------------
// Д-09 — Книга на удели
// ---------------------------------------------------------------------------

function buildBookOfShares(ctx) {
  const { co, shareholders, manager, phase2 } = ctx;
  const totalNew = ctx.totals.new || 1;

  const cell = (text, bold, pct) => new TableCell({
    width: { size: pct || 14, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ children: [new TextRun({ text: String(text), bold, font: FONT, size: 20 })], spacing: { line: LINE } })]
  });
  const headerRow = new TableRow({ children: [
    cell('Реден бр.', true, 8), cell('Име и презиме', true, 20), cell('Адреса', true, 24),
    cell('ЕМБГ', true, 16), cell('Износ на влогот (МКД)', true, 18), cell('Вид на влог', true, 8), cell('Учество со удел', true, 6)
  ] });
  const rows = [headerRow];
  shareholders.forEach((s, i) => {
    const amt = parseMKD(s.newContributionMKD);
    const pct = Math.round((amt / totalNew) * 100);
    rows.push(new TableRow({ children: [
      cell(i + 1, false, 8),
      cell(s.name || '[содружник]', false, 20),
      cell(s.newAddress || s.address || '—', false, 24),
      cell(s.idNumber || '—', false, 16),
      cell(formatMKD(amt), false, 18),
      cell('Паричен влог', false, 8),
      cell(`${pct}%`, false, 6)
    ] }));
  });

  return [
    title('КНИГА НА УДЕЛИ', { after: 120 }),
    p(co.shortName, { align: AlignmentType.CENTER, after: 20 }),
    p(co.address, { align: AlignmentType.CENTER, after: 200 }),
    p(`Основната главнина изнесува: ${mkdFull(ctx.totals.new)}`, { after: 160 }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
    p('', { after: 120 }),
    p('1. Структурата на уделите не зависи од висината на влогот на содружникот – имател на удел.', { after: 80 }),
    p(`2. Книгата е изготвена и заклучена на ден ${phase2} година.`, { after: 240 }),
    ...signature({ roleLabel: 'Управител', lines: [manager.name || '[Управител]'] })
  ];
}

// ===========================================================================
// ASSEMBLY
// ===========================================================================

/** Signatories for потписи/полномошно: all shareholders + the manager (if separate). */
function deriveSignatories(ctx) {
  const { co, shareholders, manager } = ctx;
  const shCap = co.form === 'dooel' ? 'основач – единствен содружник' : 'основач/содружник';
  const map = new Map();
  shareholders.forEach((s) => {
    const key = (s.name || '').trim().toLowerCase();
    if (key) map.set(key, { person: s, capacity: shCap });
  });
  const mKey = (manager.name || '').trim().toLowerCase();
  if (mKey) {
    if (map.has(mKey)) map.get(mKey).capacity += ' и управител';
    else map.set(mKey, { person: manager, capacity: 'управител' });
  }
  return Array.from(map.values());
}

function assembleChildren(ctx) {
  // Single-phase generation: the user picks Фаза I (намера) or Фаза II
  // (спроведување) and only that phase's documents are produced. Both ctx.phase1 and
  // ctx.phase2 hold the same active date, so the phase-specific builders are unchanged.
  const docs = []; // array of Paragraph[] (one per sub-document)
  const signatories = deriveSignatories(ctx);

  if (ctx.phase === 1) {
    docs.push(buildIntentDecision(ctx));
    if (ctx.hasPD) docs.push(buildPersonalDataDecision(ctx, ctx.phase1));
    signatories.forEach((s) => docs.push(buildSignatureStatement(ctx, s, ctx.phase1)));
    signatories.forEach((s) => docs.push(buildPowerOfAttorney(ctx, s, ctx.phase1, 1)));
  } else {
    docs.push(buildReductionDecision(ctx));
    if (ctx.hasPD) docs.push(buildPersonalDataDecision(ctx, ctx.phase2));
    docs.push(buildManagerCreditorStatement(ctx));
    docs.push(buildArticle32Statement(ctx));
    docs.push(ctx.co.form === 'dooel' ? buildConsolidatedActDOOEL(ctx) : buildConsolidatedActDOO(ctx));
    docs.push(buildActAmendmentDecision(ctx));
    docs.push(buildBookOfShares(ctx));
    signatories.forEach((s) => docs.push(buildSignatureStatement(ctx, s, ctx.phase2)));
    signatories.forEach((s) => docs.push(buildPowerOfAttorney(ctx, s, ctx.phase2, 2)));
  }

  const children = [];
  docs.forEach((block, i) => {
    if (i > 0) children.push(pageBreak());
    children.push(...block);
  });
  return children;
}

function generateCapitalReductionDoc(formData = {}, user, company) {
  const co = resolveCompany(formData, company);
  const shareholders = (Array.isArray(formData.shareholdersList) ? formData.shareholdersList : [])
    .filter((s) => s && s.name)
    .map(({ newAddress, ...s }) => s); // personal-data change not offered — drop any stray new address

  // Manager (управител) — a single person; may be one of the shareholders or separate.
  const managerForeign = formData.managerForeign === 'да' || formData.managerForeign === true;
  const manager = {
    name: formData.managerName || '[Управител]',
    entityType: 'physical',
    isForeign: managerForeign,
    citizenship: formData.managerCitizenship || '',
    address: formData.managerAddress || '[адреса]',
    idType: formData.managerIdType || (managerForeign ? 'пасош' : 'ЕМБГ'),
    idNumber: formData.managerIdNumber || '[ЕМБГ]'
  };

  // Totals derived from per-shareholder current/new влог (MKD).
  const totalCurrent = shareholders.reduce((a, s) => a + parseMKD(s.currentContributionMKD), 0);
  const totalNew = shareholders.reduce((a, s) => a + parseMKD(s.newContributionMKD), 0);
  const reduction = Math.max(totalCurrent - totalNew, 0);
  const reducedShareholders = shareholders.filter((s) => parseMKD(s.currentContributionMKD) > parseMKD(s.newContributionMKD));

  // Single-phase: the chosen phase is dated by its own date field (default today).
  const phase = formData.phase === '2' ? 2 : 1;
  const activeMoment = phase === 2
    ? (formData.phase2Date ? moment(formData.phase2Date) : moment())
    : (formData.phase1Date ? moment(formData.phase1Date) : moment());
  const dateStr = activeMoment.format('DD.MM.YYYY');

  // Personal-data change is not offered for capital reduction — always off.
  const hasPD = false;

  const ctx = {
    co,
    shareholders: shareholders.length ? shareholders : [{ name: '[Содружник]', entityType: 'physical', address: '[адреса]', idNumber: '[ЕМБГ]', currentContributionMKD: '0', newContributionMKD: '0' }],
    manager,
    formData,
    hasPD,
    phase,
    totals: { current: totalCurrent, new: totalNew, reduction },
    reducedShareholders: reducedShareholders.length ? reducedShareholders : shareholders.slice(0, 1),
    // Both hold the active date so the phase-specific builders need no changes.
    phase1: dateStr,
    phase2: dateStr
  };

  const doc = new Document({
    creator: 'Nexa Terminal',
    title: `Намалување на основна главнина — Фаза ${phase === 1 ? 'I' : 'II'}`,
    sections: [{
      properties: { page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } },
      children: assembleChildren(ctx)
    }]
  });

  return { doc };
}

module.exports = generateCapitalReductionDoc;

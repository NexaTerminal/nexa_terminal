const { Document, Paragraph, TextRun, AlignmentType, PageBreak, Table, TableRow, TableCell, WidthType } = require('docx');
const moment = require('moment');

/**
 * Промени во фирма (Централен регистар) — dynamic document package.
 *
 * Generates ONE .docx containing every document required to register the
 * selected company changes in the Trade Register (Централен регистар на РСМ),
 * separated by page breaks (same pattern as employment/mandatoryBonus.js).
 *
 * Modules (formData.changes):
 *   M1 Назив | M2 Седиште | M3 Лични податоци | M4 Управител |
 *   M6 Уплата на влог | M7 Подружница        (M5 Пренос на удел = Phase 2)
 *
 * Assembled documents:
 *   - One Одлука per selected change (Д-01..Д-05, Д-20/Д-21)
 *   - Д-13 Одлука за измена на Актот (252/253) — if any non-M7 change
 *   - Д-18 Изјава за основање (ДООЕЛ) / Д-19 Договор за основање (ДОО) — пречистен текст
 *   - Д-14 Изјава по чл. 32 (од управителот)
 *   - Д-15 Изјава по чл. 29/183/231 (за нов управител)
 *   - Д-16 Изјава за потписи + Д-17 Полномошно (по потписник)
 *
 * Architecture: each sub-document is built by a `build*` helper returning an
 * array of docx Paragraphs. `assembleChildren` selects + joins them with page
 * breaks. Source wording: extracted_templates_batch1-3.txt + MASTER §5.
 */

const FONT = 'Times New Roman';
const LINE = 276;

// ---------------------------------------------------------------------------
// Low-level paragraph helpers
// ---------------------------------------------------------------------------

function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text: text || '', bold: opts.bold, italics: opts.italics, font: FONT, size: opts.size || 24 })],
    alignment: opts.align || AlignmentType.JUSTIFIED,
    spacing: { after: opts.after != null ? opts.after : 200, line: LINE }
  });
}

/** Centered, bold title line (e.g. "О Д Л У К А"). */
function title(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, font: FONT, size: opts.size || 24 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: opts.after != null ? opts.after : 200, line: LINE }
  });
}

/** Bold, centered uppercase section header inside the consolidated act. */
function sectionHeader(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, font: FONT, size: 24 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 120, line: LINE }
  });
}

/** Bold, centered "Член N" heading. */
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

/** Signature line + name(s) under it, left aligned, no gap (MASTER §4.3). */
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

/** Joins a list with commas and "и" before the last item. */
function joinAnd(items) {
  const arr = items.filter(Boolean);
  if (arr.length === 0) return '';
  if (arr.length === 1) return arr[0];
  return arr.slice(0, -1).join(', ') + ' и ' + arr[arr.length - 1];
}

// ---------------------------------------------------------------------------
// Domain helpers — company & person identification (MASTER §5 building blocks)
// ---------------------------------------------------------------------------

function resolveCompany(formData, company) {
  return {
    fullName: formData.companyFullName || company?.companyName || '[Назив на друштвото]',
    shortName: formData.companyShortName || company?.companyName || '[Скратен назив]',
    foreignName: formData.companyForeignName || '',
    form: (formData.companyForm || 'dooel').toLowerCase(),
    address: formData.companyAddress || company?.companyAddress || company?.address || '[Адреса на седиште]',
    embs: formData.companyEMBS || '[ЕМБС]',
    edb: formData.companyEDB || company?.companyTaxNumber || company?.taxNumber || '[ЕДБ]',
    manager: formData.companyManager || company?.companyManager || company?.manager || '[Управител]'
  };
}

/** Company identity for the NEW (post-change) state, without parentheticals. */
function newStateCompany(co, changes, fd) {
  return {
    ...co,
    fullName: changes.includes('M1') && fd.newCompanyFullName ? fd.newCompanyFullName : co.fullName,
    shortName: changes.includes('M1') && fd.newCompanyShortName ? fd.newCompanyShortName : co.shortName,
    foreignName: changes.includes('M1') && fd.newCompanyForeignName ? fd.newCompanyForeignName : co.foreignName,
    address: changes.includes('M2') && fd.newSeatAddress ? fd.newSeatAddress : co.address
  };
}

/**
 * [П-ИДЕНТ] Company identification used inside decision preambles, applying the
 * СТАРО → НОВО parenthetical notation when the package also changes that datum.
 */
function pIdent(co, changes, formData) {
  let s = `${co.fullName}`;
  if (changes.includes('M1') && formData.newCompanyFullName) {
    s += ` (нов назив: ${formData.newCompanyFullName})`;
  }
  s += `, со седиште на ${co.address}`;
  if (changes.includes('M2') && formData.newSeatAddress) {
    s += ` (со нова адреса на седиште на: ${formData.newSeatAddress})`;
  }
  s += `, со ЕМБС ${co.embs} и ЕДБ ${co.edb} (во понатамошниот текст: „Друштвото")`;
  return s;
}

/** [П-ЛИЦЕ] / [П-ПРАВНО] textual identification of a person. */
function pPerson(person) {
  if (!person) return '[лице]';
  const name = person.name || '[Име и презиме]';
  if (person.entityType === 'legal') {
    return `${name}, со седиште на ${person.address || '[адреса]'}, со ЕМБС/рег. број ${person.idNumber || '[број]'}` +
      (person.representative ? `, застапувано од Управителот ${person.representative}` : '');
  }
  if (person.isForeign === true || person.isForeign === 'да' || person.isForeign === 'yes') {
    return `${name}, државјанин на ${person.citizenship || '[држава]'}, со број на пасош ${person.idNumber || '[пасош]'}, со адреса на живеење: ${person.address || '[адреса]'}`;
  }
  return `${name}, со живеалиште на адреса: ${person.address || '[адреса]'}, со ЕМБГ ${person.idNumber || '[ЕМБГ]'}`;
}

/** Preamble opener for a decision (ДООЕЛ = single shareholder, ДОО = all). */
function decisionPreamble(co, shareholders, changes, formData, opener) {
  const ident = pIdent(co, changes, formData);
  const date = fmtDate(formData.decisionDate);
  const intro = opener || 'Врз основа на одредбите од Законот за трговските друштва, како и одредбите на Актот за основање на';
  if (co.form === 'doo') {
    const list = joinAnd(shareholders.map(pPerson));
    return p(`${intro} ${ident}, основачите – содружници на Друштвото, и тоа лицата: ${list}, на ден ${date} година, ја донесоа следната:`, { after: 240 });
  }
  const sole = shareholders[0];
  return p(`${intro} ${ident}, единствениот содружник – основач на Друштвото, и тоа лицето ${pPerson(sole)}, на ден ${date} година, ја донесе следната:`, { after: 240 });
}

/** [П-ЗАВРШЕН ЧЛЕН] standard closing article body. */
function closingArticleBody() {
  return p('Оваа одлука влегува во сила со денот на нејзиното донесување и истата ќе биде запишана во Трговскиот регистар, при Централниот регистар на Република Северна Македонија.');
}

/** Optional "ОДЛУКА БРОЈ {n} од {date}" line shown before signatures. */
function decisionNumberLine(formData, numberValue) {
  if (!numberValue) return [];
  return [p(`ОДЛУКА БРОЈ ${numberValue} од ${fmtDate(formData.decisionDate)} година`, { after: 200, bold: true })];
}

/** [П-ПОТПИС-СОДРУЖНИЦИ] signature block(s) for the decision signatories. */
function shareholderSignatures(co, shareholders) {
  const out = [];
  if (co.form === 'doo') {
    out.push(...signature({ roleLabel: 'ОСНОВАЧИ – СОДРУЖНИЦИ', lines: [] }));
    shareholders.forEach((s) => out.push(...signature({ lines: signatoryNameLines(s) })));
  } else {
    out.push(...signature({ roleLabel: 'ЕДИНСТВЕН СОДРУЖНИК / ОСНОВАЧ', lines: signatoryNameLines(shareholders[0]) }));
  }
  return out;
}

/**
 * Signatories of a DECISION (одлука). The existing shareholders sign, and — per
 * Martin's rule — whenever the package introduces a new manager (M4 a/b) or a new
 * shareholder (M5 пристапување), that person also signs every decision. De-duped by
 * name so a person who is already a shareholder isn't listed twice.
 */
function decisionSignatures(ctx) {
  const { co, shareholders, changes, formData, m5 } = ctx;
  const out = shareholderSignatures(co, shareholders);
  const seen = new Set(shareholders.map((s) => (s.name || '').trim().toLowerCase()));
  const append = (person, roleLabel) => {
    if (!person || !person.name) return;
    const key = person.name.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(...signature({ roleLabel, lines: signatoryNameLines(person) }));
  };
  const newMgr = newManagerFromForm(formData, changes);
  if (newMgr) append(newMgr, 'ИДЕН УПРАВИТЕЛ');
  if (m5 && m5.transferee && m5.transferee._isNew) {
    append(m5.transferee, `СОДРУЖНИК КОЈ ПРИСТАПУВА${m5.transferee._isManager ? ' / ИДЕН УПРАВИТЕЛ' : ''}`);
  }
  return out;
}

/** Name lines under a signature line; legal entity signs "За {name}" + manager. */
function signatoryNameLines(person) {
  if (!person) return ['[Име и презиме]'];
  if (person.entityType === 'legal') {
    return [`За ${person.name || '[Назив]'}`, `Управител ${person.representative || '[застапник]'}`];
  }
  return [person.name || '[Име и презиме]'];
}

// ---------------------------------------------------------------------------
// New-person derivation
// ---------------------------------------------------------------------------

/** Builds a person object for the new manager from M4 fields (variants a/b). */
function newManagerFromForm(fd, changes) {
  if (!changes.includes('M4')) return null;
  if (!['a', 'b'].includes(fd.m4ChangeType)) return null;
  if (!fd.m4NewManagerName) return null;
  const foreign = fd.m4NewManagerForeign === 'да';
  return {
    name: fd.m4NewManagerName,
    entityType: 'physical',
    isForeign: foreign,
    citizenship: fd.m4NewManagerCitizenship,
    address: fd.m4NewManagerAddress,
    idNumber: fd.m4NewManagerIdNumber,
    idType: foreign ? 'пасош' : 'ЕМБГ'
  };
}

/** Human-readable list of selected change names (for statements / POA). */
function changeNames(changes, formData) {
  const names = {
    M1: 'промена на назив на Друштвото',
    M2: 'промена на адреса на седиште на Друштвото',
    M3: 'промена на лични податоци',
    M4: managerChangeName(formData),
    M5: 'пренос на удел' + (formData.m5TransferorWithdraws !== 'не' ? ', истапување' : '') + (formData.m5TransfereeIsNew === 'да' ? ' и пристапување на содружник' : ''),
    M6: 'уплата на основачки влог',
    M7: branchChangeName(formData)
  };
  return changes.map((c) => names[c]).filter(Boolean);
}

function managerChangeName(fd) {
  switch (fd.m4ChangeType) {
    case 'b': return 'избор на управител';
    case 'c': return 'отповикување на управител';
    case 'd': return 'промена на овластувањата на управителот';
    default: return 'отповикување на управител и избор на нов управител';
  }
}

function branchChangeName(fd) {
  return fd.m7Action === 'раководител'
    ? 'отповикување и назначување на раководител на подружница'
    : 'промена на седиште на подружница';
}

/**
 * Mandate + powers sentence shared by M4 decision and the act's manager article.
 */
function mandateAndPowers(fd) {
  const mandate = fd.m4Mandate === 'определено'
    ? `определено време до ${fd.m4MandateUntil || '[рок]'}`
    : 'неопределено време';
  const powers = fd.m4Powers === 'ограничени'
    ? `следните ограничувања: ${fd.m4PowersText || '[опис на ограничувањата]'}`
    : 'неограничени овластувања во внатрешниот и надворешниот промет';
  return { mandate, powers };
}

// ===========================================================================
// MODULE BUILDERS — each returns an array of Paragraphs (one sub-document)
// ===========================================================================

/** M1 — Д-01 Одлука за промена на назив и скратен назив. */
function buildNameDecision(ctx) {
  const { co, shareholders, changes, formData } = ctx;
  return [
    decisionPreamble(co, shareholders, changes, formData),
    title('О Д Л У К А'),
    title('за промена на назив и скратен назив на Друштвото', { after: 300 }),
    article(1),
    p('Со оваа Одлука се менува називот на Друштвото, па во иднина истиот ќе гласи:'),
    p(formData.newCompanyFullName || '[Нов полн назив]', { after: 240, bold: true }),
    article(2),
    p('Со оваа Одлука се менува и скратениот назив на Друштвото, па во иднина истиот ќе гласи:'),
    p(formData.newCompanyShortName || '[Нов скратен назив]', { after: 240, bold: true }),
    article(3),
    p('Во правниот промет со странство Друштвото ќе го користи називот:'),
    p(formData.newCompanyForeignName || '[Нов назив во странство]', { after: 240, bold: true }),
    article(4),
    closingArticleBody(),
    ...decisionNumberLine(formData, formData.nameDecisionNumber),
    ...decisionSignatures(ctx)
  ];
}

/** M2 — Д-02 Одлука за промена на адреса на седиште. */
function buildSeatDecision(ctx) {
  const { co, shareholders, changes, formData } = ctx;
  const old = formData.companyAddress || co.address;
  const next = formData.newSeatAddress || '[Нова адреса на седиште]';
  return [
    decisionPreamble(co, shareholders, changes, formData),
    title('О Д Л У К А'),
    title('за промена на адреса на седиште на Друштвото', { after: 300 }),
    article(1),
    p('Со оваа одлука се врши промена на адреса на седиштето на Друштвото.'),
    article(2),
    p(`Наместо досегашната адреса на седиште на ${old}, новата адреса на седиште на Друштвото ќе биде на следната:`),
    p(next, { after: 240 }),
    article(3),
    closingArticleBody(),
    ...decisionNumberLine(formData, formData.seatDecisionNumber),
    ...decisionSignatures(ctx)
  ];
}

/** M3 — Д-03 Одлука за промена на лични податоци. */
function buildPersonalDataDecision(ctx) {
  const { co, shareholders, changes, formData } = ctx;
  const capacity = formData.m3Capacity || 'содружникот';
  const name = formData.m3SubjectName || '[Име и презиме]';
  return [
    decisionPreamble(co, shareholders, changes, formData),
    title('О Д Л У К А'),
    title(`за промена на лични податоци на ${capacity} на Друштвото`, { after: 300 }),
    article(1),
    p(`Врз основа на оваа Одлука се врши промена на личните податоци на ${capacity} на Друштвото${formData.m3OldData ? `, кои досега гласеа: ${formData.m3OldData}` : ''}.`),
    article(2),
    p(`Личните податоци на ${capacity} ${name}, во иднина ќе гласат:`),
    p(formData.m3NewData || '[Нови лични податоци]', { after: 240, bold: true }),
    article(3),
    closingArticleBody(),
    ...decisionNumberLine(formData, formData.personalDataDecisionNumber),
    ...decisionSignatures(ctx)
  ];
}

/** M4 — Д-04 Одлука за промена на управител (варијанти a/b/c/d). */
function buildManagerDecision(ctx) {
  const { co, shareholders, changes, formData } = ctx;
  const type = formData.m4ChangeType || 'a';
  const titles = {
    a: 'за отповикување на управител и избор на нов управител',
    b: 'за избор на управител',
    c: 'за отповикување на управител',
    d: 'за промена на овластувањата на управителот'
  };
  const body = [];
  let n = 1;
  if (['a', 'c'].includes(type)) {
    body.push(article(n++));
    body.push(p('Согласно оваа Одлука, од функцијата управител на Друштвото, се отповикува лицето:'));
    body.push(p(formData.m4DismissedName || '[Управител што се отповикува]', { after: 240, bold: true }));
  }
  if (['a', 'b'].includes(type)) {
    const newMgr = newManagerFromForm(formData, changes);
    body.push(article(n++));
    body.push(p('Следното лице се именува за управител на Друштвото:'));
    body.push(p(pPerson(newMgr), { after: 240, bold: true }));
  }
  if (['a', 'b', 'd'].includes(type)) {
    const { mandate, powers } = mandateAndPowers(formData);
    body.push(article(n++));
    body.push(p(`Управителот се именува на ${mandate}.`));
    body.push(p(`Управителот се именува со ${powers}.`));
  }
  body.push(article(n++));
  body.push(closingArticleBody());

  return [
    decisionPreamble(co, shareholders, changes, formData),
    title('О Д Л У К А'),
    title(titles[type] || titles.a, { after: 300 }),
    ...body,
    ...decisionNumberLine(formData, formData.managerDecisionNumber),
    ...decisionSignatures(ctx)
  ];
}

/** M6 — Д-05 Одлука за уплата на основачки влог. */
function buildCapitalDecision(ctx) {
  const { co, shareholders, changes, formData } = ctx;
  const eur = formData.m6AmountEUR || '[износ]';
  const mkd = formData.m6AmountMKD || '[денарска противвредност]';
  return [
    decisionPreamble(co, shareholders, changes, formData),
    title('О Д Л У К А'),
    title('за уплата на основачкиот влог', { after: 300 }),
    article(1),
    p(`Врз основа на оваа Одлука се врши уплата на основачкиот влог во Друштвото и тоа паричен влог во висина од ЕУР ${eur}, односно ${mkd} денари во денарска противвредност според среден курс на НБ на РСМ на денот на уплатата.`),
    article(2),
    closingArticleBody(),
    ...decisionNumberLine(formData, formData.capitalDecisionNumber),
    ...decisionSignatures(ctx)
  ];
}

/** M7 — Д-20 (седиште) / Д-21 (раководител) Одлука кај подружница. */
function buildBranchDecision(ctx) {
  const { co, shareholders, changes, formData } = ctx;
  const branch = formData.branchFullName || '[Подружница]';
  const sub = formData.branchSubNumber || '[подброј]';

  if (formData.m7Action === 'раководител') {
    return [
      decisionPreamble(co, shareholders, changes, formData, 'Врз основа на член 26 од Законот за трговските друштва, како и во согласност со одредбите од Актот за основање на'),
      title('О Д Л У К А'),
      title('за отповикување на раководител и назначување на нов раководител на Подружница на Друштвото', { after: 300 }),
      article(1),
      p(`Согласно оваа Одлука, лицето ${formData.m7DismissedHeadName || '[раководител]'}, се отповикува од функцијата раководител на следната подружница на Друштвото:`),
      p(`${branch}, со подброј ${sub}.`, { after: 200 }),
      p('За раководител на погоре наведената Подружница на Друштвото со неограничени овластувања се назначува лицето:'),
      p(formData.m7NewHeadName || '[Нов раководител]', { after: 240, bold: true }),
      article(2),
      p('Раководителот се назначува на неопределено време, со неограничени овластувања во внатрешниот и надворешниот промет.'),
      article(3),
      closingArticleBody(),
      ...decisionNumberLine(formData, formData.branchDecisionNumber),
      ...decisionSignatures(ctx)
    ];
  }

  // седиште
  const old = formData.m7OldBranchAddress || '[стара адреса]';
  const next = formData.m7NewBranchAddress || '[нова адреса]';
  return [
    decisionPreamble(co, shareholders, changes, formData),
    title('О Д Л У К А'),
    title('за промена на адреса / седиште на Подружница', { after: 300 }),
    article(1),
    p('Со оваа одлука се врши промена на седиште на подружница на Друштвото.'),
    article(2),
    p(`Се врши промена на адресата/седиштето на ${branch} со подброј ${sub} и тоа: наместо старата адреса/седиште на ${old}, новата адреса/седиште на подружницата ќе биде на:`),
    p(next, { after: 240 }),
    article(3),
    p('Оваа одлука влегува во сила со денот на нејзиното донесување и истата ќе биде евидентирана во Трговскиот регистар.'),
    ...decisionNumberLine(formData, formData.branchDecisionNumber),
    ...decisionSignatures(ctx)
  ];
}

// ---------------------------------------------------------------------------
// Д-13 — Одлука за измена на Актот за основање (чл. 252 и 253), composite
// ---------------------------------------------------------------------------

function buildActAmendmentDecision(ctx) {
  const { co, shareholders, changes, formData } = ctx;
  const decisionList = joinAnd(changeNames(changes, formData).map((n) => `Одлуката за ${n}`));
  const date = fmtDate(formData.decisionDate);
  const ident = pIdent(co, changes, formData);
  const actNoun = co.form === 'doo' ? 'Договорот за основање' : 'Изјавата за основање';

  const preambleText = co.form === 'doo'
    ? `Во согласност со ${decisionList}, сите од ден ${date} година, а согласно членовите 252 и 253 од Законот за трговските друштва и одредбите од Актот за основање на ${ident}, основачите – содружници на Друштвото, и тоа лицата: ${joinAnd(shareholders.map(pPerson))}, на ден ${date} година, ја донесоа следната:`
    : `Во согласност со ${decisionList}, сите од ден ${date} година, а согласно членовите 252 и 253 од Законот за трговските друштва и одредбите од Актот за основање на ${ident}, единствениот содружник – основач на Друштвото, и тоа лицето ${pPerson(shareholders[0])}, на ден ${date} година, ја донесе следната:`;

  return [
    p(preambleText, { after: 240 }),
    title('О Д Л У К А'),
    title('за измена на Актот за основање на Друштвото', { after: 300 }),
    article(1),
    p(`Поради измените кои настанаа во Друштвото, врз основа на погоре наведените одлуки, а во согласност со одредбите од членот 252 и 253 од Законот за трговските друштва, ќе се подготви и ќе се потпише нов Акт за основање на Друштвото (пречистен текст), односно нов(а) ${actNoun}, кој ќе ги рефлектира промените кои настанаа во Друштвото.`),
    article(2),
    p('Со донесување на оваа одлука престануваат да важат одредбите од последниот Акт за основање на Друштвото.'),
    article(3),
    closingArticleBody(),
    ...decisionNumberLine(formData, formData.actAmendmentDecisionNumber),
    ...decisionSignatures(ctx)
  ];
}

// ---------------------------------------------------------------------------
// Д-18 / Д-19 — Пречистен текст на Актот за основање (NEW state)
// ---------------------------------------------------------------------------

function actManager(ctx) {
  const newMgr = newManagerFromForm(ctx.formData, ctx.changes);
  if (newMgr) return newMgr;
  if (ctx.m5 && ctx.m5.transferee._isManager) return ctx.m5.transferee;
  return ctx.managers[0];
}

function capitalSentence(formData, changes) {
  const eur = (changes.includes('M6') && formData.m6AmountEUR) ? formData.m6AmountEUR : (formData.companyCapitalEUR || '[износ]');
  const type = formData.companyContributionType || 'паричен';
  const mkd = formData.m6AmountMKD;
  let s = `Основната главнина на друштвото е ${type} влог во вредност од ${eur} Евра`;
  if (mkd) s += `, односно во денарска противвредност ${mkd} денари`;
  s += ', кој е уплатен во целост.';
  return s;
}

function activityArticleBody(formData) {
  const code = formData.companyActivityCode || '[шифра]';
  const text = formData.companyActivityText || '[опис на дејноста]';
  return [
    p('Друштвото ќе ги извршува сите дејности утврдени со НКД (Национална класификација на дејности) освен оние за кои е потребна согласност, дозвола или друг акт на државен или на друг надлежен орган.'),
    p('Согласно законот како предмет на работење се запишува општа клаузула за бизнис. Приоритетна дејност (Главна приходна шифра) на Друштвото е:'),
    p(`${code} – ${text}`, { bold: true }),
    p('Друштвото ќе ги извршува сите дејности во внатрешниот и надворешниот промет.')
  ];
}

/** Standard manager-powers enumeration (shared ДООЕЛ/ДОО). */
function managerPowersBody(singular) {
  const subject = singular ? 'единствениот содружник' : 'собирот на содружници';
  return [
    p('Управителот е овластен да:'),
    p('– ги извршува сите акти и дејности во управувањето во интерес на друштвото и да го претставува и застапува пред трети лица;', { after: 80 }),
    p('– се грижи за уредно и во согласност со законот водење на трговските книги, го подготвува извештајот за управувањето и годишните сметки и истите ги презентира на крајот на секоја фискална година;', { after: 80 }),
    p('– донесува одлуки за внатрешна организација на друштвото, го определува вкупниот број на вработени, ги одредува овластувањата на раководниот кадар и врши прием на нови вработени;', { after: 80 }),
    p('– покренува постапка за важни прашања за работење на друштвото и предлага решенија;', { after: 80 }),
    p('– е одговорен спрема друштвото и трети лица за работењето спротивно на одредбите на Законот и/или другите прописи и за грешките направени во управувањето со друштвото;', { after: 80 }),
    p(`– има овластување да издаде полномошно и да назначи полномошник по вработување, по претходна писмена согласност на ${subject}.`)
  ];
}

/** Д-18 — Изјава за основање (ДООЕЛ), пречистен текст. */
function buildConsolidatedActDOOEL(ctx) {
  const { changes, formData } = ctx;
  const nco = newStateCompany(ctx.co, changes, formData);
  const sole = (ctx.actShareholders || ctx.shareholders)[0];
  const mgr = actManager(ctx);
  const { mandate, powers } = changes.includes('M4') ? mandateAndPowers(formData)
    : { mandate: 'неопределено време', powers: 'неограничени овластувања во внатрешниот и надворешниот промет' };

  const out = [
    p(`Во согласност со одредбите од член 167 став 1, член 170 став 2 и член 171 од Законот за трговските друштва, единствениот содружник – основачот на ${nco.fullName}, со седиште на ${nco.address}, со ЕМБС ${nco.embs} и ЕДБ ${nco.edb} (во понатамошниот текст: „Друштвото"), и тоа лицето ${pPerson(sole)}, на ден ${fmtDate(formData.decisionDate)} година, ја дава следната:`, { after: 240 }),
    title('И З Ј А В А'),
    title('за основање на друштво со ограничена одговорност од едно лице'),
    title('(пречистен текст)', { after: 300 }),

    sectionHeader('ОПШТИ ОДРЕДБИ'),
    article(1),
    p('Оваа Изјава содржи одредби за: име, адреса и правата на содружникот; назив и седиште на друштвото; предмет на работење; времетраење; основната главнина и поединечниот влог на единствениот содружник; книгата на удели; управување и застапување; управител; права и обврски на единствениот содружник; начинот за распределба на добивката и покривање на загубите; прокура; престанок на друштвото и други одредби.'),

    sectionHeader('СОДРУЖНИК'),
    article(2),
    p('Единствен содружник и основач на друштвото е:'),
    p(pPerson(sole), { after: 200 }),

    sectionHeader('ФИРМА И СЕДИШТЕ НА ДРУШТВОТО'),
    article(3),
    p('Друштвото ќе работи под следниот назив:'),
    p(nco.fullName, { bold: true }),
    p('Скратениот назив на друштвото гласи:'),
    p(nco.shortName, { bold: true }),
    p('Во правниот промет со странство друштвото ќе го користи називот:'),
    p(nco.foreignName || '[назив во странство]', { bold: true }),
    p('За промена на фирмата на друштвото одлучува единствениот содружник.'),
    article(4),
    p('Седиштето на друштвото е на адреса:'),
    p(nco.address, { after: 200, bold: true }),

    sectionHeader('ПРЕДМЕТ НА РАБОТЕЊЕ НА ДРУШТВОТО'),
    article(5),
    ...activityArticleBody(formData),

    sectionHeader('ВРЕМЕТРАЕЊЕ НА ДРУШТВОТО'),
    article(6),
    p('Друштвото се основа на неопределено време.'),

    sectionHeader('ОСНОВНА ГЛАВНИНА И ПОЕДИНЕЧНИОТ ВЛОГ НА ЕДИНСТВЕНИОТ СОДРУЖНИК'),
    article(7),
    p(capitalSentence(formData, changes)),

    sectionHeader('КНИГА НА УДЕЛИ'),
    article(8),
    p('Друштвото води книга на удели која ја ажурира управителот. По запишувањето на друштвото во трговскиот регистар, во книгата на удели се внесуваат презимето и името, занимањето и местото на живеење на секој содружник, износот на основниот влог и посебните права и обврски што произлегуваат од него. Во книгата на удели се запишува секоја промена поврзана со уделот.'),

    sectionHeader('УПРАВУВАЊЕ И ЗАСТАПУВАЊЕ НА ДРУШТВОТО'),
    article(9),
    p('Со друштвото управува и го застапува еден управител поставен од единствениот содружник на друштвото.'),
    p('За управител на друштвото се именува:'),
    p(pPerson(mgr), { bold: true }),
    p(`Управителот се именува на ${mandate}, со ${powers}.`),

    sectionHeader('УПРАВИТЕЛ НА ДРУШТВОТО'),
    article(10),
    ...managerPowersBody(true),

    sectionHeader('ПРАВА И ОБВРСКИ НА ЕДИНСТВЕНИОТ СОДРУЖНИК'),
    article(11),
    p('Единствениот содружник врши контрола и ја усвојува годишната сметка и годишните финансиски извештаи, одлучува за распределбата на добивката и покривање на загубите; ги избира и отповикува управителот/управителите и ја утврдува неговата награда; одлучува за надоместок на дополнителни плаќања; одлучува за промена на називот, седиштето и дејноста на друштвото; одлучува за именување на управител; одлучува за зголемување на основната главнина; одлучува за реинвестирање на добивката; одлучува за пристапување на нов содружник; одлучува за покривање на загубите; одлучува за измена на оваа изјава; одлучува за престанок на друштвото и за создавање на задолжителни резерви над минимумот предвиден со закон.'),

    sectionHeader('НАЧИН НА РАСПРЕДЕЛБА НА ДОБИВКАТА И ПОКРИВАЊЕ НА ЗАГУБИТЕ'),
    article(12),
    p('Друштвото се основа заради остварување на добивка утврдена во согласност со позитивните прописи за финансиско и сметководствено работење. Деловниот резултат се утврдува со завршна сметка на крајот на секоја деловна година. Целата нето добивка му припаѓа на единствениот содружник или може да се реинвестира во друштвото врз основа на негова одлука.'),
    article(13),
    p('Загубата на друштвото ќе ја покрива единствениот содружник, соодветно на неговиот основен влог.'),

    sectionHeader('ПРОКУРА'),
    article(14),
    p('Секој прокурист мора поединечно да биде назначен од единствениот содружник на друштвото.'),
    article(15),
    p('Прокуристот може да го застапува друштвото во постапките пред управните и другите државни органи, организациите и установите со јавни овластувања и судовите, како и со трети лица во редовниот правен промет.'),
    article(16),
    p('Назначувањето на поединечните прокуристи, нивните ограничувања, овластувања и нивното отповикување го врши единствениот содружник на предлог на управителот. Со посебен договор ќе бидат регулирани нивните овластувања и награди.'),

    sectionHeader('ПРЕСТАНОК НА ДРУШТВОТО'),
    article(17),
    p('Друштвото престанува со: одлука на единствениот содружник; одлука за присоединување, спојување или поделба; стечај на друштвото; одлука на судот и други случаи определени со закон.'),

    sectionHeader('ПРЕОДНИ И ЗАВРШНИ ОДРЕДБИ'),
    article(18),
    p('Друштвото има статус на правно лице. Во правниот промет со трети лица друштвото истапува во свое име и за своја сметка, а за обврските одговара со целокупниот имот.'),
    article(19),
    p('Изјавата стапува во сила, а друштвото се смета за основано со денот на уписот во трговскиот регистар.'),
    article(20),
    p('Секоја измена и дополнување на оваа Изјава мора да биде запишана во Трговскиот регистар.', { after: 240 }),
    ...signature({ roleLabel: 'ЕДИНСТВЕН СОДРУЖНИК / ОСНОВАЧ', lines: signatoryNameLines(sole) })
  ];
  return out;
}

/** Д-19 — Договор за основање (ДОО), пречистен текст. */
function buildConsolidatedActDOO(ctx) {
  const { changes, formData } = ctx;
  const shareholders = ctx.actShareholders || ctx.shareholders;
  const nco = newStateCompany(ctx.co, changes, formData);
  const mgr = actManager(ctx);
  const { mandate, powers } = changes.includes('M4') ? mandateAndPowers(formData)
    : { mandate: 'неопределено време', powers: 'неограничени овластувања во внатрешниот и надворешниот промет' };

  const shareholderList = shareholders.map((s) => p(pPerson(s) + ';', { after: 80 }));
  const structure = shareholders.map((s) =>
    p(`Содружник ${s.name || '[содружник]'} – сопственик на удел кој претставува ${s.sharePercent || '[%]'}% од уделите во Друштвото;`, { after: 80 }));

  return [
    p(`Во согласност со одредбите од членовите 22, 167, 170 и 171 од Законот за трговските друштва, основачите/содружниците на ${nco.fullName}, со седиште на ${nco.address}, со ЕМБС ${nco.embs} и ЕДБ ${nco.edb} (во понатамошниот текст: „Друштвото") и тоа лицата:`, { after: 120 }),
    ...shareholderList,
    p(`на ден ${fmtDate(formData.decisionDate)} година, го склучија следниот:`, { after: 200 }),
    title('Д О Г О В О Р'),
    title('за основање на друштво со ограничена одговорност'),
    title('- пречистен текст -', { after: 300 }),

    sectionHeader('ОПШТИ ОДРЕДБИ'),
    article(1),
    p('Овој Договор содржи одредби за: податоци за содружниците; назив и седиште на Друштвото; предмет на работење; времетраење; основната главнина и поединечните влогови на содружниците; книгата на удели; управување и застапување; органите на Друштвото; правата и обврските на содружниците; начинот за распределба на добивката и покривање на загубите; прокура; престанок на Друштвото и други одредби.'),

    sectionHeader('СОДРУЖНИЦИ'),
    article(2),
    p('Основачи и содружници на Друштвото се:'),
    ...shareholderList,

    sectionHeader('ФИРМА И СЕДИШТЕ НА ДРУШТВОТО'),
    article(3),
    p('Друштвото ќе работи под следниот назив:'),
    p(nco.fullName, { bold: true }),
    p('Скратениот назив на друштвото гласи:'),
    p(nco.shortName, { bold: true }),
    p('Во правниот промет со странство друштвото ќе го користи називот:'),
    p(nco.foreignName || '[назив во странство]', { bold: true }),
    p('За промена на фирмата на друштвото одлучуваат содружниците.'),
    article(4),
    p('Седиштето на друштвото е на адреса:'),
    p(nco.address, { after: 200, bold: true }),

    sectionHeader('ПРЕДМЕТ НА РАБОТЕЊЕ НА ДРУШТВОТО'),
    article(5),
    ...activityArticleBody(formData),

    sectionHeader('ВРЕМЕТРАЕЊЕ НА ДРУШТВОТО'),
    article(6),
    p('Друштвото се основа на неопределено време.'),

    sectionHeader('ОСНОВНА ГЛАВНИНА И ПОЕДИНЕЧНИТЕ ВЛОГОВИ НА СОДРУЖНИЦИТЕ'),
    article(7),
    p(capitalSentence(formData, changes)),
    p('Врз основа на преземените влогови, друштвото ја има следната содружничка структура:'),
    ...structure,

    sectionHeader('КНИГА НА УДЕЛИ'),
    article(8),
    p('Друштвото води книга на удели која ја ажурираат управителите. Во книгата на удели се внесуваат презимето и името, занимањето и местото на живеење на секој содружник, износот на основниот влог и посебните права и обврски што произлегуваат од него, и се запишува секоја промена поврзана со уделот.'),

    sectionHeader('УПРАВУВАЊЕ И ЗАСТАПУВАЊЕ НА ДРУШТВОТО'),
    article(9),
    p('Со друштвото управува и го застапува еден управител поставен од содружниците на друштвото.'),
    p('За управител на друштвото се именува:'),
    p(pPerson(mgr), { bold: true }),
    p(`Управителот се именува на ${mandate}, со ${powers}.`),

    sectionHeader('ОРГАНИ НА ДРУШТВОТО'),
    article(10),
    p('Органи на друштвото се: Собир на содружници и Управител.'),
    article(11),
    p('Собирот на содружниците е највисок орган на друштвото, кој управува со работењето и одлучува за сите работи од значење за друштвото. Собирот ги усвојува годишната сметка и финансиските извештаи; одлучува за распределбата на добивката и покривање на загубите; го избира и отповикува управителот и ја утврдува неговата награда; одобрува склучување договори над една петтина од основната главнина; одлучува за измена на овој договор и врши други работи утврдени со Законот за трговските друштва.'),
    article(12),
    p('Собирот на содружници се свикува најмалку еднаш годишно, од страна на управителот, со писмена или електронска покана со дневен ред, најмалку 30 дена пред одржувањето. Собирот може да се одржи и пред истекот на рокот ако се присутни сите содружници и не се противат.'),
    article(13),
    p('Содружник на собирот може да биде претставен од друг содружник или друго лице врз основа на писмено полномошно заверено кај нотар, во кое е наведен обемот на овластувањата за застапување.'),
    article(14),
    p('За одлуките кои се однесуваат на собирот на содружници, управителот води книга на одлуки.'),

    sectionHeader('УПРАВИТЕЛ НА ДРУШТВОТО'),
    article(15),
    ...managerPowersBody(false),

    sectionHeader('ПРАВА И ОБВРСКИ НА СОДРУЖНИЦИТЕ'),
    article(16),
    p('Секој содружник има право да учествува во работата на собирот и располага со гласови сразмерно на својот удел, при што се добива по еден глас за секои 100 ЕВРА основен влог според среден курс на НБ на РСМ. Секој содружник има право на учество во управувањето и во распределбата на добивката и е должен да го одржува преземениот влог. Доколку основната главнина се намали под износот од член 7, содружниците имаат обврска да извршат доплата сразмерно на својот удел во рок од 15 дена; во спротивно тоа е основ за исклучување од друштвото.'),

    sectionHeader('НАЧИН НА РАСПРЕДЕЛБА НА ДОБИВКАТА И ПОКРИВАЊЕ НА ЗАГУБИТЕ'),
    article(17),
    p('Содружниците имаат право на учество во добивката утврдена според билансот на успехот, која се дели сразмерно на процентот на учеството во основната главнина. Содружниците можат со одлука дел од добивката да го искористат за зголемување на основната главнина.'),
    article(18),
    p('Загубата на друштвото ќе ја покриваат содружниците, соодветно на нивните основни влогови.'),

    sectionHeader('ПРОКУРА'),
    article(19),
    p('Секој прокурист мора поединечно да биде назначен од содружниците на друштвото. Прокуристот може да го застапува друштвото пред судовите, управните и другите државни органи и трети лица во редовниот правен промет. Назначувањето, ограничувањата и отповикувањето го вршат содружниците на предлог на управителот.'),

    sectionHeader('ПРЕСТАНОК И ЗАВРШНИ ОДРЕДБИ'),
    article(20),
    p('Друштвото престанува со одлука на содружниците, со присоединување, спојување или поделба, со стечај, со одлука на судот и во други случаи определени со закон. Овој Договор стапува во сила и друштвото се смета за основано со денот на уписот во трговскиот регистар, а секоја измена мора да биде запишана во Трговскиот регистар.', { after: 240 }),

    ...signature({ roleLabel: 'ОСНОВАЧИ – СОДРУЖНИЦИ', lines: [] }),
    ...shareholders.flatMap((s) => signature({ lines: signatoryNameLines(s) }))
  ];
}

// ---------------------------------------------------------------------------
// Д-14 / Д-15 — statutory statements
// ---------------------------------------------------------------------------

/**
 * Auto-generated action list for the чл.32 statement (MASTER §4.4).
 * Emits only the bullets relevant to the assembled package.
 */
function buildActionList(ctx, flags) {
  const { changes, formData } = ctx;
  const items = [];
  if (flags.hasM5) {
    items.push('Склучен и потпишан е Договор за пренос на удел и истиот е заверен на нотар;');
  }
  changeNames(changes, formData).forEach((n) => items.push(`Донесена е Одлука за ${n};`));
  if (flags.hasActChange) {
    items.push('Донесена е Одлука за измена на Актот за основање на Друштвото согласно членови 252 и 253 од Законот за трговските друштва;');
  }
  if (flags.hasM5) {
    items.push('Дадени се Понуди за преземање на уделот до Друштвото и до содружниците;');
    items.push('Дадена е Изјава за неприфаќање на понудата од страна на Друштвото и Изјава за прифаќање на понудата од страна на содружникот кој пристапува;');
    items.push('Потпишана е Пријава согласно член 200 од Законот за трговските друштва;');
    items.push('Потпишана е Книга на удели;');
  }
  if (flags.hasNewManager) {
    items.push('Дадена е Изјава согласно член 183 и член 231 став 4 од Законот за трговските друштва;');
    items.push('Потпишан е ЗП образец;');
  }
  if (flags.hasActChange) {
    items.push('Подготвен е и потпишан пречистен текст на Актот за основање на Друштвото;');
  }
  items.push('Дадена е Изјава согласно член 7 став 1 алинеја 4 од Правилникот за издавање на овластување на регистрационен агент;');
  items.push('Дадено е Полномошно кон регистрациониот агент;');
  if (flags.m5Foreign) {
    items.push('Обезбедени се уверенија/потврди за платени даноци и придонеси од Управата за јавни приходи и Царинската управа на РСМ;');
  }
  items.push('Подготвена е Пријава за упис на промените во Трговскиот регистар при Централниот регистар на РСМ;');
  items.push('Податоците содржани во Пријавата за упис, како и прилозите кои се поднесуваат кон пријавата за упис на промените се вистинити и се во согласност со закон.');
  return items.map((text) => p(`– ${text}`, { after: 80 }));
}

/** Д-14 — Изјава по член 32 (од управителот). */
function buildArticle32Statement(ctx, flags) {
  const { co, formData } = ctx;
  const manager = ctx.managers[0] || { name: co.manager };
  const names = joinAnd(changeNames(ctx.changes, formData));
  return [
    p(`Врз основа на член 32 од Законот за трговските друштва, управителот на ${pIdent(co, ctx.changes, formData)}, и тоа лицето ${pPerson(manager)}, на ден ${fmtDate(formData.decisionDate)} година, ја даде следната:`, { after: 240 }),
    title('И З Ј А В А', { after: 300 }),
    p(`Под полна морална, материјална и кривична одговорност изјавувам дека согласно член 32 од Законот за трговските друштва, во постапката за ${names}, како и постапката за измена и дополнување на Актот за основање на Друштвото, преземени се следните дејствија:`, { after: 160 }),
    ...buildActionList(ctx, flags),
    p('Оваа изјава ја давам за да послужи за запишување на промените во Трговскиот регистар при Централниот регистар на Република Северна Македонија.', { after: 300 }),
    ...signature({ roleLabel: 'УПРАВИТЕЛ', lines: [manager.name || co.manager || '[Управител]'] })
  ];
}

/**
 * Д-15 — Изјава по чл. 29 / 32 / 183 / 231 (за ново лице — еден документ по лице).
 * opts: { capacity, newShareholder, newManager }
 */
function buildNewPersonStatement(ctx, flags, person, opts) {
  const { co, formData } = ctx;
  const names = joinAnd(changeNames(ctx.changes, formData));
  const out = [
    p(`Во врска со ${names} на ${pIdent(co, ctx.changes, formData)}, а врз основа на одредбите од Законот за трговските друштва, јас долупотпишаниот/ата ${pPerson(person)}, како ${opts.capacity} на Друштвото, на ден ${fmtDate(formData.decisionDate)} година, ја давам следната:`, { after: 240 }),
    title('И З Ј А В А', { after: 300 }),
    p('Под полна морална, материјална и кривична одговорност изјавувам дека:', { after: 120 })
  ];
  if (opts.newShareholder) {
    out.push(p('Согласно член 29 од Законот за трговските друштва не постојат пречки и ограничувања од овој член или друго ограничување пропишано со овој или друг закон да бидам основач/содружник на Друштвото.', { after: 120 }));
  }
  out.push(p('Врз основа на член 32 од Законот за трговските друштва, изјавувам дека заради спроведување на горенаведените постапки, преземени се следните дејствија:', { after: 120 }));
  out.push(...buildActionList(ctx, flags));
  if (opts.newManager) {
    out.push(p('Врз основа на член 183 од Законот за трговските друштва изјавувам дека го прифаќам изборот за Управител на Друштвото и дека го прифаќам застапувањето на Друштвото како што е предвидено во Актот за основање на Друштвото.', { after: 120 }));
    out.push(p('Врз основа на член 231 став 4 од Законот за трговските друштва изјавувам дека нема правосилна судска одлука со која делумно или целосно ми е забрането да вршам професија, дејност или должност што е поврзана со функцијата Управител на Друштвото.', { after: 120 }));
  }
  out.push(p('Оваа изјава ја давам за да послужи за запишување на промените во Трговскиот регистар при Централниот регистар на Република Северна Македонија.', { after: 300 }));
  out.push(...signature({ roleLabel: 'ИЗЈАВИЛ', lines: [person.name || '[Лице]'] }));
  return out;
}

/** Д-16 — Изјава за потписи (по потписник). */
function buildSignatureStatement(ctx, signatory) {
  const { co, formData } = ctx;
  const caps = signatory.capacities.join(', ') || 'потписник';
  const names = joinAnd(changeNames(ctx.changes, formData).map((n) => `постапката за ${n}`));
  const agentName = formData.agentName || '[регистрационен агент]';
  const agentAddress = formData.agentAddress || '[адреса на агентот]';
  return [
    p(`Врз основа на член 7 став 1 алинеја 4 од Правилникот за издавање на овластување на регистрационен агент, јас, долупотпишаниот/ата ${pPerson(signatory.person)}, како ${caps} на ${pIdent(co, ctx.changes, formData)}, на ден ${fmtDate(formData.decisionDate)} година, ја давам следната:`, { after: 240 }),
    title('И З Ј А В А', { after: 300 }),
    p(`Изјавувам под полна материјална и кривична одговорност дека потписите на прилозите доставени до регистрациониот агент ${agentName}, со адреса на ${agentAddress}, во хартиена форма ги имам лично и своерачно потпишано за електронска комуникација со Централниот регистар на РСМ и други административни работи во врска со ${names}, како и постапката за измена и дополнување на Актот за основање на Друштвото, преку системот Е-Регистрација.`, { after: 300 }),
    ...signature({ roleLabel: 'ИЗЈАВИЛ', lines: signatoryNameLines(signatory.person) })
  ];
}

/** Д-17 — Полномошно за регистрационен агент (по потписник). */
function buildPowerOfAttorney(ctx, signatory, flags = {}) {
  const { co, formData } = ctx;
  const caps = signatory.capacities.join(', ') || 'потписник';
  const agentName = formData.agentName || '[регистрационен агент]';
  const agentAddress = formData.agentAddress || '[адреса на агентот]';
  const beforeOrgans = flags.hasM5
    ? 'пред Централниот регистар на РСМ, Министерство за финансии – Управа за јавни приходи на РСМ, Царинска управа на РСМ, пред сите надлежни нотари, извршители и деловни банки во РСМ, како и пред сите други правни лица и државни органи'
    : 'пред Централниот регистар на РСМ, како и пред сите деловни банки и други правни лица и државни институции';
  const out = [
    title('П О Л Н О М О Ш Н О', { after: 300 }),
    p(`Јас, долупотпишаниот/ата ${pPerson(signatory.person)}, како ${caps} на ${pIdent(co, ctx.changes, formData)}, го овластувам регистрациониот агент ${agentName}, со седиште на ${agentAddress}${formData.agentPersons ? `, претставувано преку ${formData.agentPersons}` : ''}, секој од нив поединечно или заедно, во мое име и за моја сметка да ме застапуваат ${beforeOrgans}, во следните постапки:`, { after: 160 })
  ];
  changeNames(ctx.changes, formData).forEach((n) => out.push(p(`— Постапка за ${n};`, { after: 60 })));
  out.push(p('— Постапка за измена и дополнување на Актот за основање на Друштвото;', { after: 60 }));
  if (flags.m5Foreign) {
    out.push(p('— Регистрација на странска директна инвестиција пред Регистарот за директни инвестиции.', { after: 60 }));
  }
  out.push(p('Заради спроведување на горенаведените цели, ополномоштените се овластени во мое име и за моја сметка да ги преземат сите правни дејствија, вклучувајќи: донесување, склучување, потпишување и заверка на нотар на сите акти, одлуки и изјави; поднесување на пријавите за упис на промените преку системот за е-регистрација и подигање на Решението од извршените промени.', { after: 120 }));
  if (flags.m5Foreign) {
    out.push(p('Ополномоштените се овластени да поднесат Барање за издавање на уверение за платени даноци и придонеси до Управата за јавни приходи и Царинската управа на РСМ и да ги подигнат потврдите/уверенијата.', { after: 120 }));
  }
  out.push(p('Овластувањата можат да се пренесат на трето лице.', { after: 160 }));
  out.push(p(`Во ${formData.city || 'Скопје'}, на ден ${fmtDate(formData.decisionDate)} година.`, { after: 300 }));
  out.push(...signature({ roleLabel: 'ВЛАСТОДАТЕЛ', lines: signatoryNameLines(signatory.person) }));
  return out;
}

// ===========================================================================
// M5 — Пренос на удел (share transfer) — derivation + builders
// ===========================================================================

function parsePct(v) {
  const n = parseFloat(String(v == null ? '' : v).replace(',', '.').replace('%', ''));
  return isNaN(n) ? null : n;
}

function findShareholderByName(shareholders, name) {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  return shareholders.find((s) => (s.name || '').trim().toLowerCase() === key) || null;
}

/** Builds the transferee (стекнувач) person object from M5 form fields. */
function transfereeFromForm(fd) {
  const isNew = fd.m5TransfereeIsNew === 'да';
  const foreign = fd.m5TransfereeForeign === 'да';
  return {
    name: fd.m5TransfereeName || '[Стекнувач]',
    entityType: fd.m5TransfereeIdType === 'ЕМБС' ? 'legal' : 'physical',
    isForeign: foreign,
    citizenship: fd.m5TransfereeCitizenship,
    address: fd.m5TransfereeAddress,
    idNumber: fd.m5TransfereeIdNumber,
    idType: fd.m5TransfereeIdType || (foreign ? 'пасош' : 'ЕМБГ'),
    _isNew: isNew,
    _isManager: fd.m5TransfereeIsManager === 'да'
  };
}

/** Computes all derived M5 values once (shared by builders + signatories). */
function deriveM5(ctx) {
  const { shareholders, formData: fd } = ctx;
  // Transferor: prefer the matched shareholder, but fall back to the explicit
  // M5 inputs field-by-field so address/ЕМБГ can never come out as [адреса]/[ЕМБГ].
  const matchedTor = findShareholderByName(shareholders, fd.m5TransferorName);
  const torForeign = matchedTor ? matchedTor.isForeign : (fd.m5TransferorForeign === 'да');
  const transferor = {
    name: (matchedTor && matchedTor.name) || fd.m5TransferorName || '[Отстапувач]',
    entityType: (matchedTor && matchedTor.entityType) || (fd.m5TransferorIdType === 'ЕМБС' ? 'legal' : 'physical'),
    isForeign: torForeign,
    citizenship: (matchedTor && matchedTor.citizenship) || fd.m5TransferorCitizenship || '',
    address: (matchedTor && matchedTor.address) || fd.m5TransferorAddress || '',
    idType: (matchedTor && matchedTor.idType) || fd.m5TransferorIdType || (torForeign ? 'пасош' : 'ЕМБГ'),
    idNumber: (matchedTor && matchedTor.idNumber) || fd.m5TransferorIdNumber || '',
    sharePercent: (matchedTor && matchedTor.sharePercent) || fd.m5TransferorSharePercent || '',
    shareAmountEUR: matchedTor && matchedTor.shareAmountEUR
  };

  let transferee = transfereeFromForm(fd);
  if (!transferee._isNew) {
    const existing = findShareholderByName(shareholders, fd.m5TransfereeName);
    if (existing) transferee = { ...existing, _isNew: false, _isManager: fd.m5TransfereeIsManager === 'да' };
  }

  const withdraws = fd.m5TransferorWithdraws !== 'не'; // default: истапува
  const scope = fd.m5TransferScope === 'делумен' ? 'делумен' : 'целосен';
  const withComp = fd.m5WithCompensation === 'со';
  const transferAmountEUR = fd.m5TransferAmountEUR || transferor.shareAmountEUR || '[износ]';
  const totalCapitalEUR = fd.m5TotalCapitalEUR || ctx.formData.companyCapitalEUR || '[вкупна главнина]';
  const contributionType = fd.m5ContributionType || fd.companyContributionType || 'паричен';

  const torKey = (transferor.name || '').trim().toLowerCase();
  const teeKey = (transferee.name || '').trim().toLowerCase();
  const others = shareholders.filter((s) => {
    const k = (s.name || '').trim().toLowerCase();
    return k !== torKey && (transferee._isNew || k !== teeKey);
  });

  const transfereeBecomesSole = withdraws && others.length === 0;

  // Best-effort new ownership structure (post-transfer)
  const structure = [];
  if (transfereeBecomesSole) {
    structure.push({ name: transferee.name, percent: '100' });
  } else {
    const torPct = parsePct(transferor.sharePercent);
    const movedPct = scope === 'делумен' ? parsePct(fd.m5PartialPercent) : torPct;
    others.forEach((s) => structure.push({ name: s.name, percent: s.sharePercent || '[%]' }));
    if (!withdraws && torPct != null && movedPct != null) {
      structure.push({ name: transferor.name, percent: String(Math.max(torPct - movedPct, 0)) });
    }
    const teePrev = transferee._isNew ? 0 : (parsePct(transferee.sharePercent) || 0);
    structure.push({ name: transferee.name, percent: movedPct != null ? String(teePrev + movedPct) : '[%]' });
  }

  // Post-transfer shareholder objects (full data) for the consolidated act / book.
  const newShareholders = structure.map((r) => {
    const found = findShareholderByName(shareholders, r.name) ||
      (((transferee.name || '').trim().toLowerCase() === (r.name || '').trim().toLowerCase()) ? transferee : { name: r.name, entityType: 'physical' });
    return { ...found, sharePercent: r.percent };
  });

  return { transferor, transferee, withdraws, scope, withComp, transferAmountEUR, totalCapitalEUR, contributionType, others, transfereeBecomesSole, structure, newShareholders };
}

function compPhrase(m5, fd) {
  return m5.withComp
    ? `за надомест (купопродажна цена) во износ од ${fd.m5Price || '[цена]'} ${fd.m5Currency || 'ЕУР'}`
    : 'без обврска за исплата на надомест';
}
function compShort(m5, fd) {
  return m5.withComp
    ? `за надомест во износ од ${fd.m5Price || '[цена]'} ${fd.m5Currency || 'ЕУР'}`
    : 'без обврска за исплата на надомест';
}
function scopeNoun(m5) {
  return m5.scope === 'делумен' ? 'пренос на дел од мојот удел' : 'целосен пренос на мојот удел';
}

/** Д-06 — Понуда за пренос на удел (one per recipient). */
function buildOffer(ctx, recipientText) {
  const { co, changes, formData, m5 } = ctx;
  return [
    p('ДО', { after: 40 }),
    p(recipientText, { after: 200 }),
    p('ПРЕДМЕТ: Понуда за пренос на удел', { after: 200, bold: true }),
    p(`Во согласност со одредбите од Законот за трговските друштва и одредбите на Актот за основање на ${pIdent(co, changes, formData)}, јас долупотпишаниот/ата ${pPerson(m5.transferor)}, со оваа понуда Ве известувам дека нудам ${scopeNoun(m5)} во Друштвото, изразен како ${m5.contributionType} влог во износ од ${m5.transferAmountEUR} Евра, ${compPhrase(m5, formData)}.`),
    p('Ве повикувам во рок од 30 дена да се изјасните дали сте заинтересирани за преземање на понудениот удел, во спротивно, по свој избор, а во интерес на Друштвото ќе понудам преземање на уделот на други лица.', { after: 240 }),
    p(`${formData.city || 'Скопје'}, ${fmtDate(formData.decisionDate)} година.`, { after: 240 }),
    ...signature({ lines: [m5.transferor.name || '[Отстапувач]'] })
  ];
}

/** Д-07 — Изјава за прифаќање на понудата (од стекнувачот). */
function buildAcceptance(ctx) {
  const { co, changes, formData, m5 } = ctx;
  return [
    p('ДО', { after: 40 }),
    p(pPerson(m5.transferor), { after: 200 }),
    p('ПРЕДМЕТ: Одговор на понуда за пренос на удел', { after: 200, bold: true }),
    p(`Во врска со Вашата понуда од ден ${fmtDate(formData.decisionDate)} година за преземање на удел во ${pIdent(co, changes, formData)}, определен како ${m5.contributionType} влог во износ од ${m5.transferAmountEUR} Евра, ${compShort(m5, formData)}, како и во согласност со одредбите од Законот за трговските друштва, јас долупотпишаниот/ата ${pPerson(m5.transferee)}, Ве известувам дека сум заинтересиран/а за Вашата понуда за пренос на удел во Друштвото и дека истата ја прифаќам во целост.`, { after: 240 }),
    p(`${formData.city || 'Скопје'}, ${fmtDate(formData.decisionDate)} година.`, { after: 240 }),
    ...signature({ lines: [m5.transferee.name || '[Стекнувач]'] })
  ];
}

/** Д-08 — Изјава за неприфаќање. variant: 'company' | shareholder person object. */
function buildRejection(ctx, rejector) {
  const { co, changes, formData, m5 } = ctx;
  const isCompany = rejector === 'company';
  const body = [
    p('ДО', { after: 40 }),
    p(pPerson(m5.transferor), { after: 200 }),
    p('ПРЕДМЕТ: Одговор на понуда за пренос на удел', { after: 200, bold: true }),
    p(`Во врска со понудата од ден ${fmtDate(formData.decisionDate)} година за преземање на удел во ${pIdent(co, changes, formData)}, определен како ${m5.contributionType} влог во износ од ${m5.transferAmountEUR} Евра, ${compShort(m5, formData)}, како и во согласност со одредбите од Законот за трговските друштва, со овој одговор Ве известувам${isCompany ? 'е' : ''} дека ${isCompany ? 'не сме' : 'не сум'} заинтересиран${isCompany ? 'и' : '/а'} за понудата за пренос на удел и истата не ${isCompany ? 'ја прифаќаме' : 'ја прифаќам'}.`, { after: 240 }),
    p('Со почит,', { after: 240 })
  ];
  if (isCompany) {
    body.push(...signature({ lines: [`За ${co.shortName}`, `Управител ${ctx.managers[0]?.name || co.manager || '[Управител]'}`] }));
  } else {
    body.push(...signature({ lines: signatoryNameLines(rejector) }));
  }
  return body;
}

/** Д-09 — Договор за пренос на удел (нотарска заверка). */
function buildTransferContract(ctx) {
  const { co, changes, formData, m5 } = ctx;
  const out = [
    title('ДОГОВОР ЗА ПРЕНОС НА УДЕЛ', { after: 240 }),
    p(`Склучен во ${formData.city || 'Скопје'}, на ден ${fmtDate(formData.decisionDate)} година, помеѓу:`, { after: 120 }),
    p(`${pPerson(m5.transferee)} како Стекнувач на удел${m5.transferee._isNew ? ' / Содружник кој пристапува' : ''}`, { after: 80 }),
    p('и', { after: 80 }),
    p(`${pPerson(m5.transferor)} како Отстапувач на удел${m5.withdraws ? ' / Содружник кој истапува' : ''}`, { after: 200 }),
    p('КАДЕ ШТО:', { after: 80, bold: true }),
    p(`Отстапувачот на удел е ${co.form === 'doo' ? 'содружник' : 'единствен содружник'} во ${pIdent(co, changes, formData)}, со основна главнина во износ од ${m5.totalCapitalEUR} Евра ${m5.contributionType} влог, уплатен во целост.`),
    p(`Стекнувачот изразува интерес да го преземе ${m5.scope === 'делумен' ? 'делот од уделот' : 'во целост уделот'} на Отстапувачот, изразен како ${m5.contributionType} влог во износ од ${m5.transferAmountEUR} Евра, ${compShort(m5, formData)}.`, { after: 160 }),
    article(1),
    p(`Предмет на овој договор е регулирање на правата и обврските на договорните страни во врска со пренос на удел ${m5.withComp ? 'со надомест' : 'без обврска за исплата на надомест'} во Друштвото.`),
    article(2),
    p(`Со овој Договор, Отстапувачот му го пренесува на Стекнувачот својот удел во Друштвото, изразен како ${m5.contributionType} влог во износ од ${m5.transferAmountEUR} Евра, ${compPhrase(m5, formData)}.`)
  ];
  let n = 3;
  if (m5.withComp) {
    out.push(article(n++));
    out.push(p(`Стекнувачот се обврзува надоместот од член 2 на овој Договор да му го исплати на Отстапувачот ${formData.m5PaymentTerms || 'на трансакциска сметка на Отстапувачот, во рок договорен меѓу страните'}. Со исплатата на надоместот во целост, се смета дека Стекнувачот ги намирил сите обврски кон Отстапувачот по основ на овој Договор.`));
  }
  out.push(article(n++));
  let memberArt = `Со преносот на уделот во Друштвото, Стекнувачот ${m5.transferee._isNew ? 'како содружник кој пристапува во Друштвото ' : ''}станува сопственик на уделот кој се пренесува во вкупен износ од ${m5.transferAmountEUR} Евра – ${m5.contributionType} влог.`;
  if (m5.transfereeBecomesSole) {
    memberArt += ` Со спроведување на овој Договор во Трговскиот регистар, Стекнувачот станува единствен содружник во Друштвото со целосна управувачка, административна и застапувачка моќ и сопственик на удел определен како ${m5.contributionType} влог во износ од ${m5.transferAmountEUR} Евра, што претставува 100% од запишаната основна главнина на друштвото.`;
  }
  if (m5.withdraws) {
    memberArt += ' Со преносот на уделот, на Отстапувачот му престанува содружничкиот однос во Друштвото, односно истапува од Друштвото.';
  }
  out.push(p(memberArt));
  out.push(article(n++));
  out.push(p('Со склучувањето на овој договор, договорните страни се обврзуваат да ги преземат сите дејствија за целосно завршување на постапката за пренос на уделот во Друштвото.'));
  out.push(article(n++));
  out.push(p('Овој договор ќе биде заверен кај нотар, во согласност со применливите законски прописи на Република Северна Македонија. По нотарската заверка, Договорот ќе биде поднесен до Трговскиот регистар во Централниот регистар на Република Северна Македонија заради упис на промената на сопственост.'));
  out.push(article(n++));
  out.push(p('За се што не е наведено со овој договор, ќе се применуваат одредбите на Законот за трговските друштва и Законот за облигационите односи на Република Северна Македонија.', { after: 240 }));
  out.push(...signature({ roleLabel: 'СТЕКНУВАЧ НА УДЕЛ', lines: [m5.transferee.name || '[Стекнувач]'] }));
  out.push(...signature({ roleLabel: 'ОТСТАПУВАЧ НА УДЕЛ', lines: [m5.transferor.name || '[Отстапувач]'] }));
  return out;
}

/** Д-10 — Одлука за пренос на удел, истапување и пристапување. */
function buildTransferDecision(ctx) {
  const { co, changes, formData, m5 } = ctx;
  const date = fmtDate(formData.decisionDate);
  const ident = pIdent(co, changes, formData);
  const parties = [
    `${pPerson(m5.transferee)} како Стекнувач на удел${m5.transferee._isNew ? ' / Содружник кој пристапува' : ''}`,
    `${pPerson(m5.transferor)} како Отстапувач на удел${m5.withdraws ? ' / Содружник кој истапува' : ''}`,
    ...m5.others.map((s) => `${pPerson(s)} како содружник на Друштвото`)
  ];
  const titleSuffix = `${m5.withdraws ? ', истапување на содружник' : ''}${m5.transferee._isNew ? ' и пристапување на нов содружник' : ''}`;

  const out = [
    p(`Врз основа на одредбите од Законот за трговските друштва и одредбите на Актот за основање на ${ident}, лицата: ${joinAnd(parties)}, на ден ${date} година, ја донесоа следната:`, { after: 240 }),
    title('О Д Л У К А'),
    title(`за пренос на удел${titleSuffix}`, { after: 300 }),
    article(1),
    p(`Отстапувачот му го пренесува на Стекнувачот ${m5.scope === 'делумен' ? 'дел од својот удел' : 'во целост својот удел'} во Друштвото ${compShort(m5, formData)}, изразен како ${m5.contributionType} влог во вкупен износ од ${m5.transferAmountEUR} Евра. Стекнувачот како содружник кој го презема уделот на Отстапувачот, истиот го прифаќа во целост.`),
    article(2)
  ];
  let art2 = `Со преносот на уделот во Друштвото, Стекнувачот ${m5.transferee._isNew ? 'како содружник кој пристапува кон Друштвото ' : ''}станува сопственик на уделот кој се пренесува во вкупен износ од ${m5.transferAmountEUR} Евра – ${m5.contributionType} влог.`;
  if (m5.transfereeBecomesSole) {
    art2 += ` Со преносот на уделот, Стекнувачот станува единствен содружник во Друштвото и сопственик на удел определен како ${m5.contributionType} влог во износ од ${m5.transferAmountEUR} Евра, што претставува 100% од запишаната основна главнина на друштвото.`;
  } else {
    art2 += ' По преносот, содружничката структура на Друштвото гласи: ' + m5.structure.map((r) => `Содружник ${r.name} – сопственик на удел кој претставува ${r.percent}% од уделите во Друштвото`).join('; ') + '.';
  }
  out.push(p(art2));
  out.push(p(`Вкупната вредност на основната главнина на Друштвото не се менува и изнесува ${m5.totalCapitalEUR} Евра – ${m5.contributionType} влог.`));
  let n = 3;
  if (m5.withdraws) {
    out.push(article(n++));
    out.push(p('Со преносот на уделот во Друштвото, на Отстапувачот му престанува содружничкиот однос во Друштвото, односно истиот истапува од Друштвото.'));
  }
  out.push(article(n++));
  out.push(closingArticleBody());
  out.push(...decisionNumberLine(formData, formData.transferDecisionNumber));

  // Signatures: capacities labelled
  out.push(...signature({ roleLabel: 'СТЕКНУВАЧ НА УДЕЛ', lines: [m5.transferee.name || '[Стекнувач]'] }));
  out.push(...signature({ roleLabel: 'ОТСТАПУВАЧ НА УДЕЛ', lines: [m5.transferor.name || '[Отстапувач]'] }));
  m5.others.forEach((s) => out.push(...signature({ roleLabel: 'СОДРУЖНИК', lines: signatoryNameLines(s) })));
  return out;
}

/** Д-11 — Пријава по член 200. */
function buildArticle200Application(ctx) {
  const { co, changes, formData, m5 } = ctx;
  return [
    p('ДО', { after: 40 }),
    p(`${co.fullName}`, { after: 20 }),
    p(`${co.address}`, { after: 200 }),
    p(`Согласно член 200 став 4 и 5 од Законот за трговските друштва, јас долупотпишаниот/ата ${pPerson(m5.transferee)}, како Стекнувач на удел${m5.transferee._isNew ? ' / Содружник кој пристапува' : ''}${m5.transferee._isManager ? ' и иден Управител' : ''} на ${pIdent(co, changes, formData)}, на ден ${fmtDate(formData.decisionDate)} година, ја поднесувам следнава:`, { after: 200 }),
    title('П Р И Ј А В А'),
    title('за промена на сопственост на удел', { after: 300 }),
    p(`Ја поднесувам оваа пријава за промена на сопственост на удел во Друштвото, по пат на пренос на удел, ${compShort(m5, formData)}, од содружникот ${pPerson(m5.transferor)}, определен како ${m5.contributionType} влог во вкупен износ од ${m5.transferAmountEUR} Евра.`),
    p(`Со стекнување на уделот од содружникот, станувам сопственик на уделот што се пренесува во Друштвото${m5.transfereeBecomesSole ? `, при што основниот влог на единствениот содружник изнесува ${m5.transferAmountEUR} Евра – ${m5.contributionType} влог` : ''}.`),
    p(`Вкупната вредност на основната главнина на Друштвото не се менува и изнесува ${m5.totalCapitalEUR} Евра – ${m5.contributionType} влог.`),
    p('Оваа Пријава се поднесува до Друштвото за упис на промена на сопственост на удел во Друштвото во Книгата на удели.', { after: 240 }),
    ...signature({ roleLabel: `СТЕКНУВАЧ – СОДРУЖНИК${m5.transferee._isNew ? ' КОЈ ПРИСТАПУВА' : ''}`, lines: [m5.transferee.name || '[Стекнувач]'] })
  ];
}

/** Д-12 — Книга на удели (нова состојба, потпишува управителот по промената). */
function buildBookOfShares(ctx) {
  const { co, formData, m5 } = ctx;
  const newMgr = newManagerFromForm(formData, ctx.changes);
  const bookManager = (m5.transferee._isManager ? m5.transferee.name : null) || newMgr?.name || ctx.managers[0]?.name || co.manager;

  const cell = (text, bold) => new TableCell({
    width: { size: 20, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ children: [new TextRun({ text: String(text), bold, font: FONT, size: 20 })], spacing: { line: LINE } })]
  });
  const headerRow = new TableRow({ children: ['Реден бр.', 'Содружник', 'Адреса', 'ЕМБГ/ЕМБС/пасош', 'Удел (%)'].map((h) => cell(h, true)) });

  // Rows: prefer full person data for shareholders we know, else name + structure %
  const rows = [headerRow];
  m5.structure.forEach((r, i) => {
    const person = findShareholderByName(ctx.shareholders, r.name) ||
      (((m5.transferee.name || '').trim().toLowerCase() === (r.name || '').trim().toLowerCase()) ? m5.transferee : null);
    rows.push(new TableRow({ children: [
      cell(i + 1),
      cell(r.name || '[содружник]'),
      cell(person?.address || '—'),
      cell(person?.idNumber || '—'),
      cell(r.percent)
    ] }));
  });

  return [
    title('КНИГА НА УДЕЛИ', { after: 160 }),
    p(co.shortName, { align: AlignmentType.CENTER, after: 20 }),
    p(co.address, { align: AlignmentType.CENTER, after: 200 }),
    p(`Основната главнина изнесува: ЕУР ${m5.totalCapitalEUR}.`, { after: 160 }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
    p('', { after: 120 }),
    p('1. Структурата на уделите не зависи од висината на влогот на содружниците – иматели на удели.', { after: 80 }),
    p(`2. Книгата е изготвена и заклучена на ден ${fmtDate(formData.decisionDate)} година.`, { after: 240 }),
    ...signature({ lines: [bookManager || '[Управител]'] })
  ];
}

// ===========================================================================
// ASSEMBLY
// ===========================================================================

const MODULE_BUILDERS = {
  M1: buildNameDecision,
  M2: buildSeatDecision,
  M3: buildPersonalDataDecision,
  M4: buildManagerDecision,
  M6: buildCapitalDecision,
  M7: buildBranchDecision
};

/**
 * Signatories of the package (MASTER §4.3). Shareholders sign decisions; the
 * current manager signs чл.32; a new manager signs as "иден управител". A
 * person with several capacities appears once, listing all of them.
 */
function deriveSignatories(ctx) {
  const { co, shareholders, managers, changes, formData, m5 } = ctx;
  const map = new Map();
  const add = (person, capacity) => {
    if (!person || !person.name) return;
    const key = person.name.trim().toLowerCase();
    if (!map.has(key)) map.set(key, { person, capacities: [] });
    const entry = map.get(key);
    if (capacity && !entry.capacities.includes(capacity)) entry.capacities.push(capacity);
  };
  shareholders.forEach((s) => add(s, co.form === 'doo' ? 'содружник' : 'основач – единствен содружник'));
  managers.forEach((m) => add(m, 'управител'));
  const newMgr = newManagerFromForm(formData, changes);
  if (newMgr) add(newMgr, 'иден Управител');
  if (m5) {
    add(m5.transferor, `Отстапувач на удел${m5.withdraws ? ' / Содружник кој истапува' : ''}`);
    add(m5.transferee, `Стекнувач на удел${m5.transferee._isNew ? ' / Содружник кој пристапува' : ''}`);
    if (m5.transferee._isManager) add(m5.transferee, 'иден Управител');
  }
  return Array.from(map.values());
}

function assembleChildren(ctx) {
  const { changes, formData, m5 } = ctx;
  const docs = []; // array of Paragraph[] — one per sub-document

  // M5 changes the shareholder structure → the Act must be amended + consolidated.
  const hasM5 = changes.includes('M5') && !!m5;
  const hasActChange = hasM5 || changes.some((c) => ['M1', 'M2', 'M3', 'M4', 'M6'].includes(c));
  const newMgr = newManagerFromForm(formData, changes);
  const m5Foreign = hasM5 && (m5.transferee.isForeign === true || m5.transferor.isForeign === true);
  const hasNewManager = !!newMgr || (hasM5 && m5.transferee._isManager);
  const flags = { hasActChange, hasNewManager, hasM5, m5Foreign };

  // 1) M5 transfer documents come first (contract → offers → responses → decision → application → book)
  if (hasM5) {
    docs.push(buildTransferContract(ctx));
    // Offers (Д-06): to the Company, to each other shareholder, to a third-party acquirer
    docs.push(buildOffer(ctx, `${ctx.co.fullName}, со седиште на ${ctx.co.address}`));
    m5.others.forEach((s) => docs.push(buildOffer(ctx, pPerson(s))));
    if (m5.transferee._isNew) docs.push(buildOffer(ctx, pPerson(m5.transferee)));
    // Acceptance (Д-07) from the acquirer; rejection (Д-08) from the Company + each non-taking shareholder
    docs.push(buildAcceptance(ctx));
    docs.push(buildRejection(ctx, 'company'));
    m5.others.forEach((s) => docs.push(buildRejection(ctx, s)));
  }

  // 2) One decision per selected change (module order). M5 has its own decision (Д-10).
  ['M1', 'M2', 'M3', 'M4', 'M6', 'M7'].forEach((m) => {
    if (changes.includes(m)) {
      const block = MODULE_BUILDERS[m](ctx);
      if (block.length) docs.push(block);
    }
  });
  if (hasM5) {
    docs.push(buildTransferDecision(ctx));
    docs.push(buildArticle200Application(ctx));
  }

  // 3) Act amendment (Д-13) + consolidated act (Д-18/Д-19) when an act change exists
  if (hasActChange) {
    docs.push(buildActAmendmentDecision(ctx));
    docs.push(ctx.co.form === 'doo' ? buildConsolidatedActDOO(ctx) : buildConsolidatedActDOOEL(ctx));
  }

  // 4) Book of shares (Д-12) — new ownership state, signed by the manager after the change
  if (hasM5) docs.push(buildBookOfShares(ctx));

  // 5) Statutory statements
  docs.push(buildArticle32Statement(ctx, flags));
  if (newMgr) {
    docs.push(buildNewPersonStatement(ctx, flags, newMgr, { capacity: 'иден Управител', newManager: true }));
  }
  if (hasM5 && m5.transferee._isNew) {
    docs.push(buildNewPersonStatement(ctx, flags, m5.transferee, {
      capacity: `Стекнувач на удел / Содружник кој пристапува${m5.transferee._isManager ? ' и иден Управител' : ''}`,
      newShareholder: true,
      newManager: m5.transferee._isManager
    }));
  }

  // 6) Per-signatory potpisi + polnomosno
  const signatories = deriveSignatories(ctx);
  signatories.forEach((s) => docs.push(buildSignatureStatement(ctx, s)));
  signatories.forEach((s) => docs.push(buildPowerOfAttorney(ctx, s, flags)));

  // Flatten with page breaks between documents
  const children = [];
  docs.forEach((block, i) => {
    if (i > 0) children.push(pageBreak());
    children.push(...block);
  });
  return children;
}

function generateCompanyChangesDoc(formData = {}, user, company) {
  const changes = Array.isArray(formData.changes) ? formData.changes.slice() : [];
  const co = resolveCompany(formData, company);

  const shareholders = Array.isArray(formData.shareholdersList) ? formData.shareholdersList.filter((s) => s && s.name) : [];
  const managers = Array.isArray(formData.managersList) ? formData.managersList.filter((m) => m && m.name) : [];

  const ctx = { changes, co, shareholders, managers, formData };
  if (changes.includes('M5')) {
    ctx.m5 = deriveM5(ctx);
    // The consolidated act + book reflect the NEW (post-transfer) ownership.
    ctx.actShareholders = ctx.m5.newShareholders;
    // The leaving owner IS a current shareholder. When the user entered M5 manually
    // without filling the shareholder list, seed it from the transferor so decisions
    // are signed by the actual person — not a synthesized fallback.
    if (ctx.shareholders.length === 0 && ctx.m5.transferor && ctx.m5.transferor.name && ctx.m5.transferor.name !== '[Отстапувач]') {
      ctx.shareholders = [ctx.m5.transferor];
    }
  }

  // Last-resort identity so signature lines are never empty (placeholders flag gaps).
  if (ctx.shareholders.length === 0) {
    ctx.shareholders = [{ name: co.manager, entityType: 'physical', address: '[адреса]', idNumber: '[ЕМБГ]' }];
  }
  // When no managers were entered, the manager is usually one of the known people
  // (a shareholder, or the M5 transferor/transferee). Reuse their full identity so
  // the чл.32 statement doesn't fall back to [адреса]/[ЕМБГ].
  if (ctx.managers.length === 0) {
    const known = [...ctx.shareholders];
    if (ctx.m5) known.push(ctx.m5.transferor, ctx.m5.transferee);
    const key = (co.manager || '').trim().toLowerCase();
    const match = key && known.find((p) => p && (p.name || '').trim().toLowerCase() === key);
    ctx.managers = [match ? { ...match } : { name: co.manager, entityType: 'physical', address: '[адреса]', idNumber: '[ЕМБГ]' }];
  }

  const doc = new Document({
    creator: 'Nexa Terminal',
    title: 'Промени во фирма',
    sections: [{
      properties: { page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } },
      children: assembleChildren(ctx)
    }]
  });

  return { doc };
}

module.exports = generateCompanyChangesDoc;

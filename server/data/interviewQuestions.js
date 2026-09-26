// „Интервјуа" — suggested question banks for the two HR interview types.
//
//   scan → Интервју скен: behavioral / soft-skill screening for a CANDIDATE
//          (sourced from LinkedIn's behavioral-interview-questions for soft skills:
//           adaptability, collaboration, communication, growth, leadership, ownership).
//   exit → Излезно интервју: structured EXIT interview for a departing employee
//          (sourced from Forbes exit-interview do's — understand why, improve
//           retention, stay constructive, don't burn bridges).
//
// A question is { id, text, kind } where kind is 'text' (open answer) or
// 'rating' (1–5 scale). `suggest({ type, industry, role })` assembles a
// ready-to-edit list capped at MAX_QUESTIONS: a general set plus a few
// role/industry-relevant add-ons. The owner edits this freely before sending;
// the FINALIZED list is stored per interview, so changing this file never
// mutates already-created interviews.

const MAX_QUESTIONS = 15;

// ── Интервју скен (candidate) ───────────────────────────────────────────────
const SCAN_GENERAL = [
  { id: 's_adapt',    kind: 'text',   text: 'Опишете ситуација кога моравте брзо да се прилагодите на голема промена на работа. Како постапивте?' },
  { id: 's_conflict', kind: 'text',   text: 'Раскажете за случај кога имавте несогласување со колега. Како го решивте?' },
  { id: 's_initiative', kind: 'text', text: 'Кога сте презеле иницијатива без некој да ви каже? Што направивте и каков беше исходот?' },
  { id: 's_mistake',  kind: 'text',   text: 'Опишете грешка што сте ја направиле на работа и што научивте од неа.' },
  { id: 's_priorities', kind: 'text', text: 'Како ги приоритизирате задачите кога имате повеќе рокови истовремено?' },
  { id: 's_proud',    kind: 'text',   text: 'Раскажете за постигнување на кое сте најгорди. Зошто токму тоа?' },
  { id: 's_feedback', kind: 'text',   text: 'Како реагирате кога добивате критика за вашата работа?' },
  { id: 's_teamwork', kind: 'text',   text: 'Опишете ситуација кога сте му помогнале на член од тимот да успее.' },
  { id: 's_motivation', kind: 'text', text: 'Што ве мотивира најмногу во работата и што очекувате од оваа улога?' },
  { id: 's_pressure', kind: 'rating', text: 'Колку сте комотни да работите под притисок и кратки рокови?' },
];

// role/industry keyword → one or two add-on questions
const SCAN_ADDONS = [
  { match: ['продаж', 'sales', 'комерц', 'търгов', 'trgov', 'retail', 'малопродаж'],
    q: { id: 's_sales', kind: 'text', text: 'Опишете како придобивте тежок клиент или го спасивте односот со незадоволен купувач.' } },
  { match: ['it', 'софтвер', 'develop', 'програм', 'инженер', 'engineer', 'tech', 'техн'],
    q: { id: 's_tech', kind: 'text', text: 'Опишете технички предизвик што го решивте и како пристапивте кон проблем што не сте го решавале порано.' } },
  { match: ['сметковод', 'финанс', 'account', 'finance', 'даноч', 'ревиз'],
    q: { id: 's_finance', kind: 'text', text: 'Опишете како обезбедувате точност и ги фаќате грешките во работа со бројки и рокови.' } },
  { match: ['менаџ', 'manag', 'раковод', 'lead', 'директор', 'team lead'],
    q: { id: 's_lead', kind: 'text', text: 'Опишете како мотивиравте тим или го решивте слабото извршување на член од тимот.' } },
  { match: ['маркетинг', 'market', 'реклам', 'brand', 'содржин', 'content'],
    q: { id: 's_marketing', kind: 'text', text: 'Опишете кампања или идеја што ја водевте — како ја мереше успешноста?' } },
  { match: ['клиент', 'поддршк', 'support', 'услуг', 'service', 'customer'],
    q: { id: 's_service', kind: 'text', text: 'Опишете како постапивте со особено тежок или лут корисник.' } },
];

// ── Излезно интервју (departing employee) ───────────────────────────────────
const EXIT_GENERAL = [
  { id: 'x_reason',   kind: 'text',   text: 'Која е главната причина поради која заминувате?' },
  { id: 'x_liked',    kind: 'text',   text: 'Што ви се допаѓаше најмногу во работата, тимот и компанијата?' },
  { id: 'x_frustration', kind: 'text', text: 'Што најмногу ве фрустрираше или ви пречеше додека работевте кај нас?' },
  { id: 'x_manager',  kind: 'rating', text: 'Колку се чувствувавте поддржани од вашиот директен раководител?' },
  { id: 'x_manager_note', kind: 'text', text: 'Како односот со раководството можеше да биде подобар?' },
  { id: 'x_growth',   kind: 'rating', text: 'Колку имавте јасни можности за развој и напредок?' },
  { id: 'x_culture',  kind: 'text',   text: 'Како ја оценувате комуникацијата и културата во компанијата?' },
  { id: 'x_comp',     kind: 'rating', text: 'Колку платата и бенефициите беа во согласност со вашите очекувања?' },
  { id: 'x_stay',     kind: 'text',   text: 'Што можевме да смениме за да останевте?' },
  { id: 'x_gap',      kind: 'text',   text: 'Дали новото работно место нуди нешто што овде недостасуваше?' },
  { id: 'x_recommend', kind: 'rating', text: 'Колку е веројатно дека би не препорачале како работодавач на пријател?' },
  { id: 'x_open',     kind: 'text',   text: 'Дали има нешто друго што сакате да споделите?' },
];

const EXIT_ADDONS = [
  { match: ['менаџ', 'manag', 'раковод', 'lead', 'директор'],
    q: { id: 'x_team', kind: 'text', text: 'Како ја оценувате поддршката за вас како раководител и соработката со повисокото раководство?' } },
];

const norm = (s) => String(s || '').toLowerCase();

/**
 * Assemble a suggested, editable question list for a new interview.
 * @param {object} p { type:'scan'|'exit', industry?, role? }
 * @returns {{id,text,kind}[]}
 */
function suggest({ type, industry, role } = {}) {
  const isExit = type === 'exit';
  const general = isExit ? EXIT_GENERAL : SCAN_GENERAL;
  const addons = isExit ? EXIT_ADDONS : SCAN_ADDONS;
  const haystack = `${norm(role)} ${norm(industry)}`;

  const extras = [];
  for (const a of addons) {
    if (a.match.some((m) => haystack.includes(m))) extras.push(a.q);
  }
  // General first, then relevant add-ons; open text „x_open" stays last for exit.
  let list = [...general];
  if (extras.length) {
    if (isExit) {
      const openIdx = list.findIndex((q) => q.id === 'x_open');
      const head = openIdx >= 0 ? list.slice(0, openIdx) : list;
      const tail = openIdx >= 0 ? list.slice(openIdx) : [];
      list = [...head, ...extras, ...tail];
    } else {
      list = [...list, ...extras];
    }
  }
  return list.slice(0, MAX_QUESTIONS).map((q) => ({ id: q.id, text: q.text, kind: q.kind }));
}

module.exports = { suggest, MAX_QUESTIONS };

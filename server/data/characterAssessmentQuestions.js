// „Проценка на карактер" — Big Five (OCEAN) personality assessment.
//
// Bipolar, one trait per item: each question shows two OPPOSING statements of the
// SAME trait on a 5-point scale (1 = left pole … 3 = neutral … 5 = right pole).
// `right` is always the HIGH pole of the named dimension, so a higher answer = more
// of that dimension. Neuroticism is authored + scored directly as its positive
// mirror „Емоционална стабилност" (right = more stable), so every reported
// dimension reads "higher = more of the positively-named quality".
//
// This is a self-report, INDICATIVE profile — not a clinical diagnosis. Scoring is
// done strictly server-side; the browser only ever receives the statement texts.

const DIMENSIONS = ['O', 'C', 'E', 'A', 'S']; // S = Емоционална стабилност (reverse N)

const DIMENSION_LABEL = {
  O: 'Отвореност',
  C: 'Совесност',
  E: 'Екстроверзија',
  A: 'Пријатност',
  S: 'Емоционална стабилност',
};

// One-line description of what each dimension measures (report subheadings).
const DIMENSION_BLURB = {
  O: 'Љубопитност, креативност и отвореност кон нови идеи и промени.',
  C: 'Организираност, доследност и посветеност на задачите.',
  E: 'Енергија од луѓе, иницијатива и изразување во групи.',
  A: 'Соработка, емпатија и однос со колегите.',
  S: 'Смиреност под притисок и справување со стрес и критика.',
};

const questions = [
  // ── Отвореност (Openness) ───────────────────────────────────────────────
  { id: 'o1', trait: 'O', left: 'Претпочитам докажани, рутински начини на работа.', right: 'Постојано барам нови идеи и начини да ги подобрам работите.' },
  { id: 'o2', trait: 'O', left: 'Ретко ме привлекуваат апстрактни или теоретски теми.', right: 'Уживам да размислувам за сложени, апстрактни концепти.' },
  { id: 'o3', trait: 'O', left: 'Се држам до она што веќе го знам.', right: 'Со задоволство учам нови вештини надвор од мојата област.' },
  { id: 'o4', trait: 'O', left: 'Практичните детали ми се поважни од креативните идеи.', right: 'Често доаѓам до оригинални, креативни решенија.' },
  { id: 'o5', trait: 'O', left: 'Промените во начинот на работа ме нервираат.', right: 'Лесно се прилагодувам на промени и нови ситуации.' },

  // ── Совесност (Conscientiousness) ───────────────────────────────────────
  { id: 'c1', trait: 'C', left: 'Понекогаш одолжувам со задачите до последен момент.', right: 'Задачите ги завршувам навреме и планирано.' },
  { id: 'c2', trait: 'C', left: 'Мојот работен простор и распоред често се неуредни.', right: 'Организиран сум и водам јасен ред во работата.' },
  { id: 'c3', trait: 'C', left: 'Понекогаш прескокнувам детали за да завршам побрзо.', right: 'Внимавам на деталите и на квалитетот.' },
  { id: 'c4', trait: 'C', left: 'Тешко ми е да истраам кога работата станува досадна.', right: 'Истрајувам додека не ја завршам работата како треба.' },
  { id: 'c5', trait: 'C', left: 'Повеќе работам импулсивно отколку по план.', right: 'Поставувам цели и следам план за да ги постигнам.' },

  // ── Екстроверзија (Extraversion) ────────────────────────────────────────
  { id: 'e1', trait: 'E', left: 'Претпочитам да работам сам и во тишина.', right: 'Добивам енергија од работа и дружба со луѓе.' },
  { id: 'e2', trait: 'E', left: 'Ретко го започнувам разговорот во група.', right: 'Лесно започнувам разговор и се вклучувам во групи.' },
  { id: 'e3', trait: 'E', left: 'Претпочитам да останам во позадина на состаноци.', right: 'Слободно ги изнесувам моите ставови пред другите.' },
  { id: 'e4', trait: 'E', left: 'Претпочитам мирно темпо без многу возбуда.', right: 'Уживам во динамично темпо и нови предизвици.' },
  { id: 'e5', trait: 'E', left: 'Тешко преземам водечка улога.', right: 'Природно преземам иницијатива и водство.' },

  // ── Пријатност (Agreeableness) ──────────────────────────────────────────
  { id: 'a1', trait: 'A', left: 'Се фокусирам на моите задачи повеќе отколку на туѓите чувства.', right: 'Внимавам на потребите и чувствата на другите.' },
  { id: 'a2', trait: 'A', left: 'Во несогласување цврсто се држам до мојот став.', right: 'Барам компромис за да се согласиме сите.' },
  { id: 'a3', trait: 'A', left: 'Поскоро сум директен и критичен.', right: 'Пристапувам со трпение и разбирање кон колегите.' },
  { id: 'a4', trait: 'A', left: 'Ретко нудам помош ако не ме побараат.', right: 'Со задоволство им помагам на колегите.' },
  { id: 'a5', trait: 'A', left: 'Претпочитам да се потпрам само на себе.', right: 'Лесно им верувам на другите и соработувам.' },

  // ── Емоционална стабилност (reverse Neuroticism) ────────────────────────
  { id: 's1', trait: 'S', left: 'Под притисок лесно се вознемирувам.', right: 'Останувам смирен(а) и под притисок.' },
  { id: 's2', trait: 'S', left: 'Честопати се грижам за работи што можеби нема да се случат.', right: 'Ретко се оптоварувам со непотребни грижи.' },
  { id: 's3', trait: 'S', left: 'Критиката тешко ја поднесувам.', right: 'Критиката ја примам мирно и учам од неа.' },
  { id: 's4', trait: 'S', left: 'Расположението ми варира во текот на денот.', right: 'Моето расположение е стабилно и предвидливо.' },
  { id: 's5', trait: 'S', left: 'По неуспех тешко се враќам во ритам.', right: 'Брзо се опоравувам по неуспеси и предизвици.' },
];

// Workplace-oriented interpretation per dimension × band. `low`/`mid`/`high` are the
// three score bands (see bandFor). Framed as tendencies, never verdicts.
const INTERPRETATION = {
  O: {
    high: 'Многу отворен(а) кон нови идеи — креативен(а), љубопитен(а) и брзо прифаќа промени. Одличен за иновации и учење; помалку за строго рутинска работа.',
    mid: 'Балансира меѓу докажани методи и нови идеи. Прифаќа промени кога има смисла, но цени и стабилност.',
    low: 'Претпочита докажани, предвидливи начини на работа. Силен(а) во рутински, стандардизирани задачи; на промени му треба повеќе време.',
  },
  C: {
    high: 'Многу совесен(а) — организиран(а), доследен(а) и посветен(а) на квалитет и рокови. Висока доверливост во извршување.',
    mid: 'Умерено организиран(а) и доследен(а). Ги завршува задачите, но има простор за поцврста дисциплина со приоритети.',
    low: 'Работи флексибилно и спонтано; може да му недостига структура. Има корист од јасни рокови и следење на приоритети.',
  },
  E: {
    high: 'Многу екстровертен(а) — енергичен(а), комуникативен(а) и природен(а) во преземање иницијатива. Одличен за тимска и клиентска работа.',
    mid: 'Рамнотежа меѓу дружење и самостојна работа. Комотен(а) и во групи и во фокусирана индивидуална работа.',
    low: 'Претпочита мирна, фокусирана и самостојна работа. Силен(а) во длабинска концентрација; помалку во интензивна социјална средина.',
  },
  A: {
    high: 'Многу пријатен(а) — соработлив(а), емпатичен(а) и ориентиран(а) кон тимот. Гради добри односи; внимавајте да не избегнува тешки разговори.',
    mid: 'Соработлив(а), но и способен(а) да го задржи својот став. Здрав баланс меѓу тимски дух и директност.',
    low: 'Директен(а) и ориентиран(а) кон задачи повеќе отколку кон хармонија. Јасен(а) во ставови; има корист од повеќе такт во комуникацијата.',
  },
  S: {
    high: 'Висока емоционална стабилност — смирен(а) под притисок, добро поднесува стрес и критика и брзо се опоравува. Стабилен(а) во кризни ситуации.',
    mid: 'Генерално стабилен(а); повремено чувствителен(а) на притисок или критика, но се справува добро.',
    low: 'Почувствителен(а) на стрес, притисок и критика. Дава најдобро во смирена, поддржувачка средина со јасни очекувања.',
  },
};

const DISCLAIMER = 'Ова е индикативна самопроценка на личноста базирана на моделот „Големите пет“ (Big Five). Не претставува клиничка дијагноза ниту гаранција за работно однесување и служи само како помошна алатка при запознавање на кандидатот/вработениот.';

function bandFor(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'mid';
  return 'low';
}
const BAND_LABEL = { high: 'Високо', mid: 'Умерено', low: 'Ниско' };

const VALID_VALUES = new Set([1, 2, 3, 4, 5]);
const QUESTION_IDS = new Set(questions.map((q) => q.id));

/**
 * Score a map of { qid: 1..5 } into per-dimension 0–100 scores + report.
 * Only counts answered items; a dimension needs at least one answer to score.
 * Returns { scores, report } where report is the array the UI renders.
 */
function score(answers = {}) {
  const sums = {}; const counts = {};
  DIMENSIONS.forEach((d) => { sums[d] = 0; counts[d] = 0; });

  questions.forEach((q) => {
    const v = Number(answers[q.id]);
    if (!VALID_VALUES.has(v)) return;
    sums[q.trait] += v; counts[q.trait] += 1;
  });

  const scores = {};
  DIMENSIONS.forEach((d) => {
    // Average of answered items (1..5) → 0..100. Neutral (3) → 50.
    scores[d] = counts[d] ? Math.round(((sums[d] / counts[d]) - 1) / 4 * 100) : null;
  });

  const report = DIMENSIONS.map((d) => {
    const s = scores[d];
    const band = s == null ? null : bandFor(s);
    return {
      dimension: d,
      label: DIMENSION_LABEL[d],
      blurb: DIMENSION_BLURB[d],
      score: s,
      band,
      bandLabel: band ? BAND_LABEL[band] : null,
      interpretation: band ? INTERPRETATION[d][band] : null,
    };
  });

  return { scores, report };
}

// Reject a submission unless enough items are answered for a credible profile.
function isComplete(answers = {}) {
  const answered = Object.keys(answers).filter(
    (k) => QUESTION_IDS.has(k) && VALID_VALUES.has(Number(answers[k]))
  ).length;
  return answered >= Math.ceil(questions.length * 0.8); // ≥20 of 25
}

// Sanitize an incoming answers object down to known ids + valid 1..5 values.
function cleanAnswers(answers = {}) {
  const clean = {};
  for (const [k, v] of Object.entries(answers)) {
    const n = Number(v);
    if (QUESTION_IDS.has(k) && VALID_VALUES.has(n)) clean[k] = n;
  }
  return clean;
}

module.exports = {
  questions,
  DIMENSIONS,
  DIMENSION_LABEL,
  DIMENSION_BLURB,
  INTERPRETATION,
  DISCLAIMER,
  BAND_LABEL,
  bandFor,
  score,
  isComplete,
  cleanAnswers,
  // The public payload — statement texts only, never any scoring keys.
  publicQuestions: () => questions.map(({ id, trait, left, right }) => ({ id, trait, left, right })),
};

// ── quick self-check: `node server/data/characterAssessmentQuestions.js` ──────
if (require.main === module) {
  const assert = require('node:assert/strict');
  assert.equal(questions.length, 25, 'expected 25 questions');
  DIMENSIONS.forEach((d) => {
    const n = questions.filter((q) => q.trait === d).length;
    assert.equal(n, 5, `dimension ${d} should have 5 items, has ${n}`);
  });
  assert.equal(new Set(questions.map((q) => q.id)).size, 25, 'ids must be unique');

  // All-5 → every dimension 100; all-1 → 0; all-3 → 50.
  const all = (v) => Object.fromEntries(questions.map((q) => [q.id, v]));
  assert.deepEqual(score(all(5)).scores, { O: 100, C: 100, E: 100, A: 100, S: 100 });
  assert.deepEqual(score(all(1)).scores, { O: 0, C: 0, E: 0, A: 0, S: 0 });
  assert.deepEqual(score(all(3)).scores, { O: 50, C: 50, E: 50, A: 50, S: 50 });
  assert.equal(score(all(5)).report[0].bandLabel, 'Високо');
  assert.equal(score(all(1)).report[0].bandLabel, 'Ниско');
  assert.equal(isComplete(all(5)), true);
  assert.equal(isComplete({ o1: 5, o2: 4 }), false);
  console.log('✓ characterAssessmentQuestions self-check passed (25 items, scoring OK)');
}

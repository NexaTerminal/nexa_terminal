// „Проценка на карактер" — Big Five (OCEAN) personality assessment.
//
// Bipolar, one trait per item: each question shows two OPPOSING statements of the
// SAME trait on a 5-point scale (1 = left statement … 3 = neutral … 5 = right
// statement). `highPole` says which side is the HIGH end of the named dimension:
//   - highPole 'right' → picking 5 = more of the dimension
//   - highPole 'left'  → picking 1 = more of the dimension (REVERSE-KEYED)
// Mixing keyed directions cancels acquiescence ("always agree") bias, which makes
// the profile more trustworthy than a one-directional questionnaire.
//
// 33 items across 5 dimensions with facet coverage. Neuroticism is authored +
// scored directly as its positive mirror „Емоционална стабилност" (high = calmer),
// so every reported dimension reads "higher = more of the positively-named quality".
//
// This is a self-report, INDICATIVE profile — not a clinical diagnosis. Scoring runs
// strictly server-side; the browser only ever receives the statement texts.

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

// left / right = the two statements as shown. highPole = which side is the HIGH end.
const questions = [
  // ── Отвореност (Openness): curiosity, imagination, learning, aesthetics, risk ──
  { id: 'o1', trait: 'O', highPole: 'right', left: 'Претпочитам докажани, рутински начини на работа.', right: 'Постојано барам нови идеи и начини да ги подобрам работите.' },
  { id: 'o2', trait: 'O', highPole: 'right', left: 'Ретко ме привлекуваат апстрактни или теоретски теми.', right: 'Уживам да размислувам за сложени, апстрактни концепти.' },
  { id: 'o3', trait: 'O', highPole: 'right', left: 'Се држам до она што веќе го знам.', right: 'Со задоволство учам нови вештини надвор од мојата област.' },
  { id: 'o4', trait: 'O', highPole: 'left', left: 'Често доаѓам до оригинални, креативни решенија.', right: 'Претпочитам да следам постоечки, проверени решенија.' },
  { id: 'o5', trait: 'O', highPole: 'right', left: 'Промените во начинот на работа ме нервираат.', right: 'Лесно се прилагодувам на промени и нови ситуации.' },
  { id: 'o6', trait: 'O', highPole: 'right', left: 'Ретко забележувам детали во дизајн, естетика или презентација.', right: 'Имам око за детали во дизајн, естетика и презентација.' },
  { id: 'o7', trait: 'O', highPole: 'left', left: 'Сакам да експериментирам со нови пристапи, дури и кога има ризик.', right: 'Претпочитам да не ризикувам со непроверени пристапи.' },

  // ── Совесност (Conscientiousness): order, discipline, reliability, deliberation ──
  { id: 'c1', trait: 'C', highPole: 'right', left: 'Понекогаш одолжувам со задачите до последен момент.', right: 'Задачите ги завршувам навреме и планирано.' },
  { id: 'c2', trait: 'C', highPole: 'right', left: 'Мојот работен простор и распоред често се неуредни.', right: 'Организиран сум и водам јасен ред во работата.' },
  { id: 'c3', trait: 'C', highPole: 'right', left: 'Понекогаш прескокнувам детали за да завршам побрзо.', right: 'Внимавам на деталите и на квалитетот.' },
  { id: 'c4', trait: 'C', highPole: 'right', left: 'Тешко ми е да истраам кога работата станува досадна.', right: 'Истрајувам додека не ја завршам работата како треба.' },
  { id: 'c5', trait: 'C', highPole: 'left', left: 'Поставувам цели и следам план за да ги постигнам.', right: 'Повеќе работам импулсивно, како ќе дојде.' },
  { id: 'c6', trait: 'C', highPole: 'right', left: 'Понекогаш давам ветувања што тешко ги исполнувам навреме.', right: 'Кога ќе ветам нешто, се трудам секогаш да го исполнам.' },
  { id: 'c7', trait: 'C', highPole: 'left', left: 'Проверувам двапати пред да предадам работа.', right: 'Обично предавам без дополнителна проверка.' },

  // ── Екстроверзија (Extraversion): sociability, assertiveness, energy, warmth ──
  { id: 'e1', trait: 'E', highPole: 'right', left: 'Претпочитам да работам сам и во тишина.', right: 'Добивам енергија од работа и дружба со луѓе.' },
  { id: 'e2', trait: 'E', highPole: 'right', left: 'Ретко го започнувам разговорот во група.', right: 'Лесно започнувам разговор и се вклучувам во групи.' },
  { id: 'e3', trait: 'E', highPole: 'right', left: 'Претпочитам да останам во позадина на состаноци.', right: 'Слободно ги изнесувам моите ставови пред другите.' },
  { id: 'e4', trait: 'E', highPole: 'left', left: 'Природно преземам иницијатива и водство.', right: 'Претпочитам друг да ја води ситуацијата.' },
  { id: 'e5', trait: 'E', highPole: 'right', left: 'По цел ден со луѓе се чувствувам исцрпено.', right: 'По цел ден со луѓе се чувствувам полн со енергија.' },
  { id: 'e6', trait: 'E', highPole: 'right', left: 'Ретко го покажувам ентузијазмот отворено.', right: 'Отворено покажувам ентузијазам и позитивна енергија.' },

  // ── Пријатност (Agreeableness): trust, altruism, cooperation, empathy, modesty ──
  { id: 'a1', trait: 'A', highPole: 'right', left: 'Се фокусирам на моите задачи повеќе отколку на туѓите чувства.', right: 'Внимавам на потребите и чувствата на другите.' },
  { id: 'a2', trait: 'A', highPole: 'right', left: 'Во несогласување цврсто се држам до мојот став.', right: 'Барам компромис за да се согласиме сите.' },
  { id: 'a3', trait: 'A', highPole: 'right', left: 'Поскоро сум директен и критичен.', right: 'Пристапувам со трпение и разбирање кон колегите.' },
  { id: 'a4', trait: 'A', highPole: 'right', left: 'Ретко нудам помош ако не ме побараат.', right: 'Со задоволство им помагам на колегите.' },
  { id: 'a5', trait: 'A', highPole: 'right', left: 'Претпочитам да се потпрам само на себе.', right: 'Лесно им верувам на другите и соработувам.' },
  { id: 'a6', trait: 'A', highPole: 'left', left: 'Го ставам интересот на тимот пред мојот личен.', right: 'Прво го гледам мојот личен интерес.' },
  { id: 'a7', trait: 'A', highPole: 'right', left: 'Кога некој греши, брзо реагирам остро.', right: 'Кога некој греши, реагирам смирено и со разбирање.' },

  // ── Емоционална стабилност (reverse Neuroticism): calm, resilience, even temper ──
  { id: 's1', trait: 'S', highPole: 'right', left: 'Под притисок лесно се вознемирувам.', right: 'Останувам смирен(а) и под притисок.' },
  { id: 's2', trait: 'S', highPole: 'right', left: 'Честопати се грижам за работи што можеби нема да се случат.', right: 'Ретко се оптоварувам со непотребни грижи.' },
  { id: 's3', trait: 'S', highPole: 'right', left: 'Критиката тешко ја поднесувам.', right: 'Критиката ја примам мирно и учам од неа.' },
  { id: 's4', trait: 'S', highPole: 'left', left: 'Моето расположение е стабилно и предвидливо.', right: 'Расположението ми варира во текот на денот.' },
  { id: 's5', trait: 'S', highPole: 'right', left: 'По неуспех тешко се враќам во ритам.', right: 'Брзо се опоравувам по неуспеси и предизвици.' },
  { id: 's6', trait: 'S', highPole: 'right', left: 'Кога има повеќе рокови одеднаш, паничам.', right: 'Кога има повеќе рокови одеднаш, останувам присебен(а).' },
];

// Workplace-oriented interpretation per dimension × band (low / mid / high).
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

// Second-person "how it shows up" narrative per dimension × band — the friendly,
// CliftonStrengths-style copy used in the ranked results list + the employee email.
const NARRATIVE = {
  O: {
    high: 'Ве привлекуваат нови идеи и можности. Лесно учите, експериментирате и гледате поинакви решенија таму каде што другите гледаат рутина.',
    mid: 'Цените и докажани методи и нови идеи. Отворени сте за промени кога гледате јасна смисла и корист.',
    low: 'Се потпирате на проверено и предвидливо. Најсилни сте кога работата е јасна и структурирана, а на новините им давате време.',
  },
  C: {
    high: 'На вас може да се смета. Планирате, внимавате на детали и ги доведувате работите до крај — навреме и уредно.',
    mid: 'Ги завршувате обврските и држите солиден ред, со простор за уште поцврсти приоритети под голем обем.',
    low: 'Работите флексибилно и спонтано. Најдобри сте кога има јасни рокови и структура што ве држат во тек.',
  },
  E: {
    high: 'Добивате енергија од луѓе. Лесно комуницирате, преземате иницијатива и внесувате позитивна енергија во тимот.',
    mid: 'Подеднакво сте комотни и во друштво и во самостојна работа, и се прилагодувате според ситуацијата.',
    low: 'Претпочитате мир и фокус. Најсилни сте во длабинска, самостојна работа наместо во постојана социјална динамика.',
  },
  A: {
    high: 'Вреднувате добри односи. Соработувате, слушате и внимавате на потребите на другите во тимот.',
    mid: 'Балансирате меѓу тимски дух и своето мислење — соработувате, но знаете и да застанете зад својот став.',
    low: 'Директни сте и ориентирани кон резултат. Јасно го кажувате мислењето; со малку повеќе такт градите и подобри односи.',
  },
  S: {
    high: 'Останувате смирени под притисок. Добро поднесувате стрес и критика и брзо се враќате во ритам по неуспех.',
    mid: 'Генерално сте стабилни; понекогаш ве допира притисокот или критиката, но се справувате добро.',
    low: 'Почувствителни сте на стрес и притисок. Давате најмногу во смирена, поддржувачка средина со јасни очекувања.',
  },
};

// Domain color per dimension (bg tint · accent rule · text) — shared by the report
// component and the results email so both look identical.
const DIMENSION_COLOR = {
  O: { accent: '#2f855a', bg: '#e6f4ec', text: '#22543d' }, // green
  C: { accent: '#6b46c1', bg: '#ece7f8', text: '#44337a' }, // purple
  E: { accent: '#dd6b20', bg: '#fdebd8', text: '#7b341e' }, // orange
  A: { accent: '#2b6cb0', bg: '#dde9fb', text: '#1a365d' }, // blue
  S: { accent: '#2c7a7b', bg: '#d9f1f0', text: '#1d4044' }, // teal
};

// Short "at work" strength tag per dimension, used in the overall summary.
const STRENGTH_TAG = {
  O: 'иновативност и учење',
  C: 'доверливост и организираност',
  E: 'комуникација и иницијатива',
  A: 'тимска работа и соработка',
  S: 'смиреност под притисок',
};
const GROWTH_TAG = {
  O: 'отвореност кон нови пристапи',
  C: 'доследност и планирање',
  E: 'иницијатива и видливост во групи',
  A: 'такт и тимска ориентација',
  S: 'справување со стрес и критика',
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

// A raw 1..5 answer → a 1..5 contribution toward the HIGH pole (reverse-keyed flip).
function contribution(q, value) {
  return q.highPole === 'left' ? 6 - value : value;
}

/**
 * Score a map of { qid: 1..5 } into per-dimension 0–100 scores + report + overall.
 * Only counts answered items; a dimension needs at least one answer to score.
 */
function score(answers = {}) {
  const sums = {}; const counts = {};
  DIMENSIONS.forEach((d) => { sums[d] = 0; counts[d] = 0; });

  questions.forEach((q) => {
    const v = Number(answers[q.id]);
    if (!VALID_VALUES.has(v)) return;
    sums[q.trait] += contribution(q, v); counts[q.trait] += 1;
  });

  const scores = {};
  DIMENSIONS.forEach((d) => {
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
      narrative: band ? NARRATIVE[d][band] : null,
      color: DIMENSION_COLOR[d],
    };
  });

  // Ranked strongest → weakest, for the CliftonStrengths-style results list.
  const ranked = report.filter((r) => r.score != null).sort((a, b) => b.score - a.score);
  return { scores, report, ranked, overall: buildOverall(report) };
}

// A short, plain-language summary: top strengths + the main area to develop.
function buildOverall(report) {
  const scored = report.filter((r) => r.score != null);
  if (!scored.length) return null;
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const strengths = sorted.filter((r) => r.band !== 'low').slice(0, 2);
  const lowest = sorted[sorted.length - 1];
  const growth = lowest && lowest.band !== 'high' ? lowest : null;

  const parts = [];
  if (strengths.length) {
    parts.push(`Најизразени страни: ${strengths.map((r) => STRENGTH_TAG[r.dimension]).join(' и ')}.`);
  }
  if (growth) {
    parts.push(`Простор за развој: ${GROWTH_TAG[growth.dimension]}.`);
  }
  return {
    text: parts.join(' '),
    topDimensions: strengths.map((r) => r.dimension),
    growthDimension: growth ? growth.dimension : null,
  };
}

// Reject a submission unless enough items are answered for a credible profile.
function isComplete(answers = {}) {
  const answered = Object.keys(answers).filter(
    (k) => QUESTION_IDS.has(k) && VALID_VALUES.has(Number(answers[k]))
  ).length;
  return answered >= Math.ceil(questions.length * 0.8); // ≥27 of 33
}

// Sanitize incoming answers down to known ids + valid 1..5 values.
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
  NARRATIVE,
  DIMENSION_COLOR,
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
  assert.equal(questions.length, 33, 'expected 33 questions');
  assert.equal(new Set(questions.map((q) => q.id)).size, 33, 'ids must be unique');
  questions.forEach((q) => {
    assert.ok(['left', 'right'].includes(q.highPole), `${q.id} needs highPole`);
    assert.ok(DIMENSIONS.includes(q.trait), `${q.id} bad trait`);
  });
  const perTrait = Object.fromEntries(DIMENSIONS.map((d) => [d, questions.filter((q) => q.trait === d).length]));
  console.log('per-trait counts:', perTrait);
  DIMENSIONS.forEach((d) => assert.ok(perTrait[d] >= 6, `${d} should have ≥6 items`));
  const reversed = questions.filter((q) => q.highPole === 'left').length;
  assert.ok(reversed >= 5, 'expected several reverse-keyed items for validity');

  // Answering every item at its HIGH pole → 100; at its LOW pole → 0; neutral → 50.
  const highPoleAnswers = Object.fromEntries(questions.map((q) => [q.id, q.highPole === 'right' ? 5 : 1]));
  const lowPoleAnswers = Object.fromEntries(questions.map((q) => [q.id, q.highPole === 'right' ? 1 : 5]));
  const neutralAnswers = Object.fromEntries(questions.map((q) => [q.id, 3]));
  assert.deepEqual(score(highPoleAnswers).scores, { O: 100, C: 100, E: 100, A: 100, S: 100 });
  assert.deepEqual(score(lowPoleAnswers).scores, { O: 0, C: 0, E: 0, A: 0, S: 0 });
  assert.deepEqual(score(neutralAnswers).scores, { O: 50, C: 50, E: 50, A: 50, S: 50 });
  assert.equal(score(highPoleAnswers).report[0].bandLabel, 'Високо');
  assert.ok(score(highPoleAnswers).overall.text.length > 0, 'overall summary present');
  assert.equal(isComplete(highPoleAnswers), true);
  assert.equal(isComplete({ o1: 5, o2: 4 }), false);
  console.log(`✓ self-check passed (33 items, ${reversed} reverse-keyed, scoring + summary OK)`);
}

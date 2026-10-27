/**
 * Retrieval vocabulary bridge for Дина (accounting).
 *
 * Users ask in everyday words ("трошоци што не се признаваат", "кирија"), the
 * tax laws use statutory terms ("непризнаени расходи за даночни цели",
 * "закупнина"). Hybrid search misses the right article when the two don't
 * overlap, so we append the statutory terms to Дина's SEARCH query only (the
 * LLM still sees the user's original question). Substring matching on purpose:
 * JS \b is ASCII-only and useless around Cyrillic.
 */

const TERM_BRIDGE = [
  [/трошо/i, 'расходи'],
  [/не се признава|непризна|признат/i, 'непризнаени расходи за даночни цели'],
  [/плата|платата|плати(те)? (на|за) вработ|бруто|нето/i, 'бруто плата придонеси данок на личен доход'],
  [/да (ми )?плати|плаќањ|доспев|рок за плаќ/i, 'рок за плаќање парични обврски финансиска дисциплина економски оператори'],
  [/кири|закуп/i, 'закупнина'],
  [/ддв/i, 'данок на додадена вредност'],
  [/регистр/i, 'регистрација вкупен промет праг'],
  [/аванс/i, 'авансно плаќање'],
  [/репрезентац|ручек|угостит/i, 'трошоци за репрезентација'],
  [/амортиз|основн(о|и) средств/i, 'амортизација материјални средства'],
  [/отпис|ненаплат|не плаќа|долж/i, 'исправка на вредноста на ненаплатените побарувања'],
  [/дневниц|службено патување/i, 'дневници за службени патувања'],
  [/странск|странство|увоз|од германија|од ЕУ/i, 'промет на услуги од странство примател даночен должник'],
  [/донаци|спонзор/i, 'донации спонзорства'],
  [/загуб/i, 'пренесување загуба'],
  [/аконтаци/i, 'месечни аконтации'],
  [/казн|глоб/i, 'парични казни прекршок'],
];

/** The search query with statutory terms appended (unchanged when none apply). */
function expandAccountingQuery(question) {
  const q = String(question || '');
  const extra = TERM_BRIDGE.filter(([re]) => re.test(q)).map(([, terms]) => terms);
  return extra.length ? `${q} ${extra.join(' ')}` : q;
}

module.exports = { expandAccountingQuery };

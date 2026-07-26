import React from 'react';
import LhcMaturityQuestionnaire from '../../../components/terminal/lhc/LhcMaturityQuestionnaire';

const TaxGeneralQuestionnaire = () => (
  <LhcMaturityQuestionnaire
    moduleKey="tax_general"
    title="Проверка на усогласеност — Општа даночна дисциплина"
    intro="Одговорете на прашањата за да добиете индикативна проценка на општата даночна дисциплина (уредни деловни книги, чување документи 10/5 години, рокови на плаќање по финансиска дисциплина, дневен готовински извештај и данок по задршка кон нерезиденти). Овие обврски важат за секоја компанија. Ова е самопроценка, не даночен совет."
    questionsPath="/lhc/tax-general/questions"
    evaluatePath="/lhc/tax-general/evaluate"
    reportBase="/terminal/legal-screening/tax-general/report"
    creditLabel="правен здравствен преглед - општа даночна дисциплина"
  />
);

export default TaxGeneralQuestionnaire;

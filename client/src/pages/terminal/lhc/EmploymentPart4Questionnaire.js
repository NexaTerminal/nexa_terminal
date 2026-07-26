import React from 'react';
import LhcMaturityQuestionnaire from '../../../components/terminal/lhc/LhcMaturityQuestionnaire';

const EmploymentPart4Questionnaire = () => (
  <LhcMaturityQuestionnaire
    moduleKey="employment_part4"
    title="Проверка на усогласеност — Посебна заштита (Дел 4)"
    intro="Одговорете на прашањата за да добиете индикативна проценка на усогласеноста со Законот за работните односи во делот на посебна заштита (бременост, родителство, инвалидитет)."
    questionsPath="/lhc/employment-part4/questions"
    evaluatePath="/lhc/employment-part4/evaluate"
    reportBase="/terminal/legal-screening/employment-part4/report"
    creditLabel="правен здравствен преглед - работни односи (Дел 4)"
  />
);

export default EmploymentPart4Questionnaire;

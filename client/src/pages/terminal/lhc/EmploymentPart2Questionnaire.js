import React from 'react';
import LhcMaturityQuestionnaire from '../../../components/terminal/lhc/LhcMaturityQuestionnaire';

const EmploymentPart2Questionnaire = () => (
  <LhcMaturityQuestionnaire
    moduleKey="employment_part2"
    title="Проверка на усогласеност — Работно место и заштита (Дел 2)"
    intro="Одговорете на прашањата за да добиете индикативна проценка на усогласеноста со Законот за работните односи во делот на заштита, престанок и плаќање."
    questionsPath="/lhc/employment-part2/questions"
    evaluatePath="/lhc/employment-part2/evaluate"
    reportBase="/terminal/legal-screening/employment-part2/report"
    creditLabel="правен здравствен преглед - работни односи (Дел 2)"
  />
);

export default EmploymentPart2Questionnaire;

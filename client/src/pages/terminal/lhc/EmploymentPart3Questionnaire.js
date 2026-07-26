import React from 'react';
import LhcMaturityQuestionnaire from '../../../components/terminal/lhc/LhcMaturityQuestionnaire';

const EmploymentPart3Questionnaire = () => (
  <LhcMaturityQuestionnaire
    moduleKey="employment_part3"
    title="Проверка на усогласеност — Работно време и одмор (Дел 3)"
    intro="Одговорете на прашањата за да добиете индикативна проценка на усогласеноста со Законот за работните односи во делот на работно време, паузи и одмори."
    questionsPath="/lhc/employment-part3/questions"
    evaluatePath="/lhc/employment-part3/evaluate"
    reportBase="/terminal/legal-screening/employment-part3/report"
    creditLabel="правен здравствен преглед - работни односи (Дел 3)"
  />
);

export default EmploymentPart3Questionnaire;

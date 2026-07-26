import React from 'react';
import LhcMaturityQuestionnaire from '../../../components/terminal/lhc/LhcMaturityQuestionnaire';

// Part 1 uses the graduated a/b/c/d maturity questionnaire (profiling + applicability).
const EmploymentPart1Questionnaire = () => (
  <LhcMaturityQuestionnaire
    moduleKey="employment_part1"
    title="Проверка на усогласеност — Вработување и договори (Дел 1)"
    intro="Одговорете на прашањата за да добиете индикативна проценка на усогласеноста со Законот за работните односи во делот на вработување и договори. Изберете го одговорот што најдобро ја опишува вашата моментална практика."
    questionsPath="/lhc/employment-part1/questions"
    evaluatePath="/lhc/employment-part1/evaluate"
    reportBase="/terminal/legal-screening/employment-part1/report"
    creditLabel="правен здравствен преглед - работни односи (Дел 1)"
  />
);

export default EmploymentPart1Questionnaire;

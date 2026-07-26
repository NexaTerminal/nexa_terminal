import React from 'react';
import LhcMaturityQuestionnaire from '../../../components/terminal/lhc/LhcMaturityQuestionnaire';

const HealthAndSafetyQuestionnaire = () => (
  <LhcMaturityQuestionnaire
    moduleKey="health_safety"
    title="Проверка на усогласеност — Безбедност и здравје при работа"
    intro="Одговорете на прашањата за да добиете индикативна проценка на усогласеноста со Законот за безбедност и здравје при работа и подзаконските правилници. Изберете го одговорот што најдобро ја опишува вашата моментална практика."
    questionsPath="/lhc/health-safety/questions"
    evaluatePath="/lhc/health-safety/evaluate"
    reportBase="/terminal/legal-screening/health-safety/report"
    creditLabel="правен здравствен преглед - безбедност и здравје при работа"
  />
);

export default HealthAndSafetyQuestionnaire;

import React from 'react';
import LhcMaturityQuestionnaire from '../../../components/terminal/lhc/LhcMaturityQuestionnaire';

const GDPRQuestionnaire = () => (
  <LhcMaturityQuestionnaire
    moduleKey="gdpr"
    title="Проверка на усогласеност — Заштита на лични податоци (GDPR)"
    intro="Одговорете на прашањата за да добиете индикативна проценка на нивото на усогласеност со Законот за заштита на личните податоци. Одговорите се степенувани — изберете го оној што најдобро ја опишува вашата моментална практика."
    questionsPath="/lhc/gdpr/questions"
    evaluatePath="/lhc/gdpr/evaluate"
    reportBase="/terminal/legal-screening/gdpr/report"
    creditLabel="правен здравствен преглед - заштита на лични податоци"
  />
);

export default GDPRQuestionnaire;

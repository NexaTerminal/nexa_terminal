import React from 'react';
import LhcMaturityQuestionnaire from '../../../components/terminal/lhc/LhcMaturityQuestionnaire';

const ProtectionRescueQuestionnaire = () => (
  <LhcMaturityQuestionnaire
    moduleKey="protection_rescue"
    title="Проверка на усогласеност — Заштита, спасување и превенција на пожари"
    intro="Одговорете на прашањата за да добиете индикативна проценка на усогласеноста со обврските за заштита и спасување и превенција на пожари (Закон за заштита и спасување, Закон за пожарникарството и правилниците). Изберете го одговорот што најдобро ја опишува вашата моментална практика."
    questionsPath="/lhc/protection-rescue/questions"
    evaluatePath="/lhc/protection-rescue/evaluate"
    reportBase="/terminal/legal-screening/protection-rescue/report"
    creditLabel="правен здравствен преглед - заштита, спасување и превенција на пожари"
  />
);

export default ProtectionRescueQuestionnaire;

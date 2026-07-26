import React from 'react';
import LhcMaturityQuestionnaire from '../../../components/terminal/lhc/LhcMaturityQuestionnaire';

const WasteManagementQuestionnaire = () => (
  <LhcMaturityQuestionnaire
    moduleKey="waste_management"
    title="Проверка на усогласеност — Управување со отпад, пакување и батерии"
    intro="Одговорете на прашањата за да добиете индикативна проценка на усогласеноста со прописите за управување со отпад, пакување и батерии. Дел од обврските важат само за одредени дејности — прво ќе ве прашаме за профилот на вашата компанија."
    questionsPath="/lhc/waste-management/questions"
    evaluatePath="/lhc/waste-management/evaluate"
    reportBase="/terminal/legal-screening/waste-management/report"
    creditLabel="правен здравствен преглед - управување со отпад"
  />
);

export default WasteManagementQuestionnaire;

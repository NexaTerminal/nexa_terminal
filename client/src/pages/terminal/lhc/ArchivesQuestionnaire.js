import React from 'react';
import LhcMaturityQuestionnaire from '../../../components/terminal/lhc/LhcMaturityQuestionnaire';

const ArchivesQuestionnaire = () => (
  <LhcMaturityQuestionnaire
    moduleKey="archives"
    title="Проверка на усогласеност — Архивско и канцелариско работење"
    intro="Одговорете на прашањата за да добиете индикативна проценка на усогласеноста со Законот за архивски материјал и архивска дејност (135/2025, примена од 1 јуни 2026) и Упатството за канцелариско и архивско работење (99/2014)."
    questionsPath="/lhc/archives/questions"
    evaluatePath="/lhc/archives/evaluate"
    reportBase="/terminal/legal-screening/archives/report"
    creditLabel="правен здравствен преглед - архивско и канцелариско работење"
  />
);

export default ArchivesQuestionnaire;

import React from 'react';
import LhcMaturityQuestionnaire from '../../../components/terminal/lhc/LhcMaturityQuestionnaire';

const TaxProfitQuestionnaire = () => (
  <LhcMaturityQuestionnaire
    moduleKey="tax_profit"
    title="Проверка на усогласеност — Данок на добивка"
    intro="Одговорете на прашањата за да добиете индикативна проценка на усогласеноста со Законот за данокот на добивка (признати/непризнати расходи, лимити, режим и трансферни цени). Дел од обврските важат само за одреден режим или дејност — прво ќе ве прашаме за профилот на вашата компанија. Ова е самопроценка, не даночен совет."
    questionsPath="/lhc/tax-profit/questions"
    evaluatePath="/lhc/tax-profit/evaluate"
    reportBase="/terminal/legal-screening/tax-profit/report"
    creditLabel="правен здравствен преглед - данок на добивка"
  />
);

export default TaxProfitQuestionnaire;

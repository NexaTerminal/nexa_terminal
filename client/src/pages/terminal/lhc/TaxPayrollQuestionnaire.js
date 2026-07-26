import React from 'react';
import LhcMaturityQuestionnaire from '../../../components/terminal/lhc/LhcMaturityQuestionnaire';

const TaxPayrollQuestionnaire = () => (
  <LhcMaturityQuestionnaire
    moduleKey="tax_payroll"
    title="Проверка на усогласеност — Плати, придонеси и персонален данок"
    intro="Одговорете на прашањата за да добиете индикативна проценка на усогласеноста со прописите за плати, придонеси и персонален данок (целосна основица, бенефиции во натура, класификација на ангажмани, МПИН и рокови). Модулот се однесува главно на работодавачи — прво ќе ве прашаме дали имате вработени. Ова е самопроценка, не даночен совет."
    questionsPath="/lhc/tax-payroll/questions"
    evaluatePath="/lhc/tax-payroll/evaluate"
    reportBase="/terminal/legal-screening/tax-payroll/report"
    creditLabel="правен здравствен преглед - плати и придонеси"
  />
);

export default TaxPayrollQuestionnaire;

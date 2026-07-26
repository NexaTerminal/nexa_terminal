import React from 'react';
import LhcMaturityQuestionnaire from '../../../components/terminal/lhc/LhcMaturityQuestionnaire';

const TaxVatQuestionnaire = () => (
  <LhcMaturityQuestionnaire
    moduleKey="tax_vat"
    title="Проверка на усогласеност — Данок на додадена вредност (ДДВ)"
    intro="Одговорете на прашањата за да добиете индикативна проценка на усогласеноста со Законот за ДДВ (одбивка на претходен данок, пријави и уплати, евиденции, ослободен/мешан промет и фискализација). Дел од прашањата важат само ако сте регистрирани за ДДВ или работите со готовина — прво ќе ве прашаме за профилот. Ова е самопроценка, не даночен совет."
    questionsPath="/lhc/tax-vat/questions"
    evaluatePath="/lhc/tax-vat/evaluate"
    reportBase="/terminal/legal-screening/tax-vat/report"
    creditLabel="правен здравствен преглед - ДДВ"
  />
);

export default TaxVatQuestionnaire;

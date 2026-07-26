import React from 'react';
import LhcModuleReport from '../../../components/terminal/lhc/LhcModuleReport';

const EmploymentPart2Report = () => (
  <LhcModuleReport
    title="Извештај — Работно место и заштита (Дел 2)"
    fetchBase="/lhc/employment-part2/assessment"
    retakePath="/terminal/legal-screening/employment-part2"
  />
);

export default EmploymentPart2Report;

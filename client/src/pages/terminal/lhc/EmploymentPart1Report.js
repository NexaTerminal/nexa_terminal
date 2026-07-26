import React from 'react';
import LhcModuleReport from '../../../components/terminal/lhc/LhcModuleReport';

const EmploymentPart1Report = () => (
  <LhcModuleReport
    title="Извештај — Вработување и договори (Дел 1)"
    fetchBase="/lhc/employment-part1/assessment"
    retakePath="/terminal/legal-screening/employment-part1"
  />
);

export default EmploymentPart1Report;

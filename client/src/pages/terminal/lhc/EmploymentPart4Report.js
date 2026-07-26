import React from 'react';
import LhcModuleReport from '../../../components/terminal/lhc/LhcModuleReport';

const EmploymentPart4Report = () => (
  <LhcModuleReport
    title="Извештај — Посебна заштита (Дел 4)"
    fetchBase="/lhc/employment-part4/assessment"
    retakePath="/terminal/legal-screening/employment-part4"
  />
);

export default EmploymentPart4Report;

import React from 'react';
import LhcModuleReport from '../../../components/terminal/lhc/LhcModuleReport';

const EmploymentPart3Report = () => (
  <LhcModuleReport
    title="Извештај — Работно време и одмор (Дел 3)"
    fetchBase="/lhc/employment-part3/assessment"
    retakePath="/terminal/legal-screening/employment-part3"
  />
);

export default EmploymentPart3Report;

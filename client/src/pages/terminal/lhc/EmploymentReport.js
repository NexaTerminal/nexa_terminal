import React from 'react';
import LhcModuleReport from '../../../components/terminal/lhc/LhcModuleReport';

const EmploymentReport = () => (
  <LhcModuleReport
    title="Извештај за усогласеност — Работни односи"
    fetchBase="/lhc/employment/assessment"
    retakePath="/terminal/legal-screening/employment"
  />
);

export default EmploymentReport;

import React from 'react';
import LhcModuleReport from '../../../components/terminal/lhc/LhcModuleReport';

const TaxPayrollReport = () => (
  <LhcModuleReport
    title="Извештај за усогласеност — Плати, придонеси и персонален данок"
    fetchBase="/lhc/tax-payroll/assessment"
    retakePath="/terminal/legal-screening/tax-payroll"
  />
);

export default TaxPayrollReport;

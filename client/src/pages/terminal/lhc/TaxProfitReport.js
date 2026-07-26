import React from 'react';
import LhcModuleReport from '../../../components/terminal/lhc/LhcModuleReport';

const TaxProfitReport = () => (
  <LhcModuleReport
    title="Извештај за усогласеност — Данок на добивка"
    fetchBase="/lhc/tax-profit/assessment"
    retakePath="/terminal/legal-screening/tax-profit"
  />
);

export default TaxProfitReport;

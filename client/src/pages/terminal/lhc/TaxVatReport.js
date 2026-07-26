import React from 'react';
import LhcModuleReport from '../../../components/terminal/lhc/LhcModuleReport';

const TaxVatReport = () => (
  <LhcModuleReport
    title="Извештај за усогласеност — Данок на додадена вредност (ДДВ)"
    fetchBase="/lhc/tax-vat/assessment"
    retakePath="/terminal/legal-screening/tax-vat"
  />
);

export default TaxVatReport;

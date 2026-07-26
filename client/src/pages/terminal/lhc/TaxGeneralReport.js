import React from 'react';
import LhcModuleReport from '../../../components/terminal/lhc/LhcModuleReport';

const TaxGeneralReport = () => (
  <LhcModuleReport
    title="Извештај за усогласеност — Општа даночна дисциплина"
    fetchBase="/lhc/tax-general/assessment"
    retakePath="/terminal/legal-screening/tax-general"
  />
);

export default TaxGeneralReport;

import React from 'react';
import LhcModuleReport from '../../../components/terminal/lhc/LhcModuleReport';

const HealthAndSafetyReport = () => (
  <LhcModuleReport
    title="Извештај за усогласеност — Безбедност и здравје при работа"
    fetchBase="/lhc/health-safety/assessment"
    retakePath="/terminal/legal-screening/health-safety"
  />
);

export default HealthAndSafetyReport;

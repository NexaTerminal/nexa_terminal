import React from 'react';
import LhcModuleReport from '../../../components/terminal/lhc/LhcModuleReport';

const WasteManagementReport = () => (
  <LhcModuleReport
    title="Извештај за усогласеност — Управување со отпад, пакување и батерии"
    fetchBase="/lhc/waste-management/assessment"
    retakePath="/terminal/legal-screening/waste-management"
  />
);

export default WasteManagementReport;

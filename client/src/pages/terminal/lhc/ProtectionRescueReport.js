import React from 'react';
import LhcModuleReport from '../../../components/terminal/lhc/LhcModuleReport';

const ProtectionRescueReport = () => (
  <LhcModuleReport
    title="Извештај за усогласеност — Заштита, спасување и превенција на пожари"
    fetchBase="/lhc/protection-rescue/assessment"
    retakePath="/terminal/legal-screening/protection-rescue"
  />
);

export default ProtectionRescueReport;

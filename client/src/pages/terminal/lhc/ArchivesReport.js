import React from 'react';
import LhcModuleReport from '../../../components/terminal/lhc/LhcModuleReport';

const ArchivesReport = () => (
  <LhcModuleReport
    title="Извештај за усогласеност — Архивско и канцелариско работење"
    fetchBase="/lhc/archives/assessment"
    retakePath="/terminal/legal-screening/archives"
    redFlagNote="Активирана е црвена линија (небезбедно чување, уништување трајна архива, отстапување кон странство или спречување надзор). Овие ставки се прикажани како приоритетни ризици подолу."
  />
);

export default ArchivesReport;

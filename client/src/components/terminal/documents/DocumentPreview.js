import React from 'react';
import { useAuth } from '../../../contexts/AuthContext'; // Corrected path
import styles from '../../../styles/terminal/documents/DocumentGeneration.module.css';
import moment from 'moment';
import documentCategories from '../../../data/documentCategories.json';

const formatDate = (dateString) => {
  if (!dateString) return '';
  return moment(dateString).isValid() ? moment(dateString).format('DD.MM.YYYY') : dateString;
};

const getCurrentDate = () => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date().toLocaleDateString('mk-MK', options); // Changed to Macedonian locale
};

function getDocumentHeadline(documentType) {
  for (const category of documentCategories) {
    for (const template of category.templates || []) {
      if (template.id === documentType) {
        return template.name;
      }
    }
  }
  return '[Наслов на документ]';
}

const documentHeadlines = {
  // Employment
  terminationAgreement: "СПОГОДБА ЗА ПРЕСТАНОК НА РАБОТЕН ОДНОС",
  terminationDecisionDueToDuration: "ОДЛУКА за престанок на Договорот за вработување поради истек на времето за кое бил склучен",
  annualLeaveDecision: "РЕШЕНИЕ ЗА ГОДИШЕН ОДМОР",
  confirmationOfEmployment: "ПОТВРДА ЗА ВРАБОТУВАЊЕ",
  employmentAgreement: "ДОГОВОР ЗА ВРАБОТУВАЊЕ",
  disciplinaryAction: "РЕШЕНИЕ ЗА ДИСЦИПЛИНСКА МЕРКА",
  terminationWarning: "ПРЕДУПРЕДУВАЊЕ пред откажување на договор за вработување",
  employmentAnnex: "АНЕКС кон договор за вработување",
  warningLetter: "ОПОМЕНА до вработен",

  // Personal Data Protection
  consentForPersonalDataProcessing: "СОГЛАСНОСТ ЗА ОБРАБОТКА НА ЛИЧНИ ПОДАТОЦИ",

  // Contracts
  rentAgreement: "ДОГОВОР ЗА ЗАКУП НА НЕДВИЖЕН ИМОТ",

  // ...add more as needed
};

const renderUniversalPreview = ({ formData, company, documentType }) => {
  // Add defensive checks
  if (!formData || typeof formData !== 'object') {
    return (
      <div className={styles.document}>
        <h2 className={styles.title}>[Наслов на документ]</h2>
        <p>Внесете податоци за да видите преглед на документот...</p>
      </div>
    );
  }
  
  const headline = documentHeadlines[documentType] || '[Наслов на документ]';
  // Define a mapping of field keys to labels for all supported fields
  const fieldLabels = {
    // Employment fields
    employeeName: 'Име и презиме',
    employeePIN: 'ЕМБГ',
    employeeAddress: 'Адреса',
    endDate: 'Датум на престанок',
    annualLeaveYear: 'Година на одмор',
    annualLeaveStart: 'Почеток на одмор',
    annualLeaveEnd: 'Крај на одмор',
    jobPosition: 'Работна позиција',
    employeePosition: 'Работна позиција',
    workTasks: 'Работни обврски',
    netSalary: 'Основна плата',
    placeOfWork: 'Место на работа',
    otherWorkPlace: 'Друго место на работа',
    agreementDate: 'Датум на договор',
    agreementDurationType: 'Тип на договор',
    definedDuration: 'Краен датум',
    dailyWorkTime: 'Работно време',
    otherWorkTime: 'Друго работно време',
    concurrentClause: 'Конкурентска клаузула',
    concurrentClauseInput: 'Детали за конкурентска клаузула',
    sanctionAmount: 'Висина на казната',
    sanctionPeriod: 'Период на казната',
    sanctionDate: 'Датум на казната',
    workTaskFailure: 'Работна обврска која е запостави',
    employeeWrongDoing: 'Што направил работникот погрешно',
    employeeWrongdoingDate: 'Датум на постапувањето',
    employmentEndDate: 'Датум на престанок на работниот однос',
    decisionDate: 'Датум на одлуката',
    fixingDeadline: 'Рок за исправка',
    warningDate: 'Датум на опомената',
    rulesNotRespected: 'Правила кои не се почитуваат',
    articleNumber: 'Член од договорот за вработување',
    
    // Rent Agreement fields
    contractDate: 'Датум на договор',
    contractTown: 'Место на склучување',
    userRole: 'Ваша улога',
    otherPartyType: 'Тип на другата страна',
    otherPartyName: 'Име на физичкото лице',
    otherPartyAddress: 'Адреса на физичкото лице',
    otherPartyPIN: 'ЕМБГ',
    otherPartyCompanyName: 'Име на компанијата',
    otherPartyCompanyAddress: 'Адреса на компанијата',
    otherPartyCompanyManager: 'Управител на компанијата',
    otherPartyCompanyTaxNumber: 'Даночен број на компанијата',
    propertyAddress: 'Адреса на недвижноста',
    cadastralParcelNumber: 'Катастарска парцела',
    cadastralMunicipality: 'Катастарска општина',
    propertySheetNumber: 'Имотен лист',
    propertySize: 'Површина (м²)',
    propertyType: 'Тип на објект',
    rentAmount: 'Месечна закупнина (EUR)',
    rentPaymentDeadline: 'Рок за плаќање',
    durationType: 'Времетраење',
    durationValue: 'Период',
    endDate: 'Краен датум',
    bankAccount: 'Жиро сметка',
    bankName: 'Банка',
    
    // Add more fields as needed
  };
  // Define which fields to show for each document type (order matters)
  const documentFields = {
    terminationAgreement: ['employeeName', 'employeePIN', 'employeeAddress', 'endDate'],
    terminationDecisionDueToDuration: ['employeeName', 'jobPosition', 'employmentEndDate', 'decisionDate', 'agreementDate'],
    annualLeaveDecision: ['employeeName', 'employeePosition', 'annualLeaveYear', 'annualLeaveStart', 'annualLeaveEnd'],
    employmentAgreement: ['employeeName', 'employeePIN', 'employeeAddress', 'jobPosition', 'workTasks', 'netSalary', 'agreementDate', 'agreementDurationType', 'dailyWorkTime'],
    disciplinaryAction: ['employeeName', 'jobPosition', 'sanctionAmount', 'sanctionPeriod', 'sanctionDate', 'workTaskFailure', 'employeeWrongDoing', 'employeeWrongdoingDate'],
    terminationWarning: ['employeeName', 'jobPosition', 'decisionDate', 'workTaskFailure', 'employeeWrongDoing', 'fixingDeadline'],
    warningLetter: ['employeeName', 'warningDate', 'employeeWrongDoing', 'rulesNotRespected', 'articleNumber'],
    rentAgreement: ['contractDate', 'contractTown', 'userRole', 'otherPartyType', 'otherPartyName', 'otherPartyCompanyName', 'propertyAddress', 'propertyType', 'propertySize', 'rentAmount', 'rentPaymentDeadline', 'durationType', 'durationValue', 'endDate'],
    // Add more document types as needed
  };
  const fieldsToShow = documentFields[documentType] || Object.keys(formData || {});
  return (
    <div className={styles.document}>
      <h2 className={styles.title}>{headline}</h2>
      {company?.companyName && (
        <p><strong>Друштво:</strong> {company.companyName}</p>
      )}
      {company?.address && (
        <p><strong>Адреса:</strong> {company.address}</p>
      )}
      {company?.taxNumber && (
        <p><strong>ЕДБ:</strong> {company.taxNumber}</p>
      )}
      {fieldsToShow.map((field) => (
        formData[field] ? (
          <p key={field}>
            <strong>{fieldLabels[field] || field}:</strong> {
              Array.isArray(formData[field]) 
                ? formData[field].join(', ')
                : ['endDate', 'annualLeaveStart', 'annualLeaveEnd', 'agreementDate', 'definedDuration', 'sanctionDate', 'employeeWrongdoingDate', 'employmentEndDate', 'decisionDate', 'fixingDeadline', 'warningDate', 'contractDate'].includes(field) 
                  ? formatDate(formData[field]) 
                  : formData[field]
            }
          </p>
        ) : null
      ))}
    </div>
  );
};

const DocumentPreview = ({ formData, documentType, currentStep }) => {
  const { currentUser } = useAuth();
  const company = currentUser?.companyInfo || {};

  if (!currentUser) {
    return <div className={styles.previewContainer}><p>Ве молиме најавете се за да ги видите деталите за компанијата.</p></div>;
  }

  // Add default values if formData is not provided
  const safeFormData = formData || {};

  return (
    <div className={styles.previewContainer}>
      {renderUniversalPreview({ formData: safeFormData, company, documentType })}
    </div>
  );
};

export default DocumentPreview;


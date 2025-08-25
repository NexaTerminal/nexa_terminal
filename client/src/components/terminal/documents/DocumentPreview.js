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
  annualLeaveDecision: "РЕШЕНИЕ ЗА ГОДИШЕН ОДМОР",
  confirmationOfEmployment: "ПОТВРДА ЗА ВРАБОТУВАЊЕ",

  // Personal Data Protection
  consentForPersonalDataProcessing: "СОГЛАСНОСТ ЗА ОБРАБОТКА НА ЛИЧНИ ПОДАТОЦИ",

  // ...add more as needed
};

const renderUniversalPreview = ({ formData, company, documentType }) => {
  const headline = documentHeadlines[documentType] || '[Наслов на документ]';
  // Define a mapping of field keys to labels for all supported fields
  const fieldLabels = {
    employeeName: 'Име и презиме',
    employeePIN: 'ЕМБГ',
    employeeAddress: 'Адреса',
    endDate: 'Датум на престанок',
    annualLeaveYear: 'Година на одмор',
    annualLeaveStart: 'Почеток на одмор',
    annualLeaveEnd: 'Крај на одмор',
    // Add more fields as needed
  };
  // Define which fields to show for each document type (order matters)
  const documentFields = {
    terminationAgreement: ['employeeName', 'employeePIN', 'employeeAddress', 'endDate'],
    annualLeaveDecision: ['employeeName', 'annualLeaveYear', 'annualLeaveStart', 'annualLeaveEnd'],
    // Add more document types as needed
  };
  const fieldsToShow = documentFields[documentType] || Object.keys(formData);
  return (
    <div className={styles.document}>
      <h2 className={styles.title}>{headline}</h2>
      {company.companyName && (
        <p><strong>Друштво:</strong> {company.companyName}</p>
      )}
      {company.address && (
        <p><strong>Адреса:</strong> {company.address}</p>
      )}
      {company.taxNumber && (
        <p><strong>ЕДБ:</strong> {company.taxNumber}</p>
      )}
      {fieldsToShow.map((field) => (
        formData[field] ? (
          <p key={field}>
            <strong>{fieldLabels[field] || field}:</strong> {['endDate', 'annualLeaveStart', 'annualLeaveEnd'].includes(field) ? formatDate(formData[field]) : formData[field]}
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

  return (
    <div className={styles.previewContainer}>
      {renderUniversalPreview({ formData, company, documentType })}
    </div>
  );
};

export default DocumentPreview;


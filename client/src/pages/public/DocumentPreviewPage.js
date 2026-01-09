import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import styles from '../../styles/public/DocumentPreview.module.css';

/**
 * Document type translations to Macedonian
 */
const documentTypeTranslations = {
  // Employment documents
  bonusDecision: 'Одлука за доделување бонус',
  employmentAgreement: 'Договор за вработување',
  terminationAgreement: 'Спогодба за престанок на работен однос',
  annualLeaveDecision: 'Одлука за годишен одмор',
  unpaidLeaveDecision: 'Одлука за неплатено отсуство',
  warningLetter: 'Опомена до вработен',
  confirmationOfEmployment: 'Потврда за вработување',
  mandatoryBonus: 'Одлука за задолжителен бонус',
  annualLeaveBonusDecision: 'Одлука за годишен одмор и бонус',
  deathCompensationDecision: 'Одлука за надомест во случај на смрт',
  disciplinaryAction: 'Дисциплинска мерка',
  employeeDamagesStatement: 'Изјава за штета од вработен',
  employmentAnnex: 'Анекс на договор за вработување',
  organizationAct: 'Акт за организација',
  terminationByEmployeeRequest: 'Престанок на барање на вработен',
  terminationDecisionDueToDuration: 'Одлука за престанок поради истек на рок',
  terminationDueToAgeLimit: 'Престанок поради возрасна граница',
  terminationDueToFault: 'Престанок поради вина',
  terminationPersonalReasons: 'Престанок поради лични причини',
  terminationWarning: 'Предупредување за престанок',

  // Contract documents
  rentAgreement: 'Договор за закуп',
  nda: 'Договор за доверливост',
  mediationAgreement: 'Договор за посредување',
  vehicleSalePurchaseAgreement: 'Договор за купопродажба на возило',
  debtAssumptionAgreement: 'Договор за преземање на долг',
  saasAgreement: 'SaaS Договор',

  // Other business documents
  warningBeforeLawsuit: 'Опомена пред тужба',
};

/**
 * Get Macedonian name for document type
 */
const getDocumentTypeMacedonian = (type) => {
  return documentTypeTranslations[type] || 'Документ';
};

/**
 * Document Preview Page
 * Displays full document content before generation
 * Accessible via shareable preview link
 */
const DocumentPreviewPage = () => {
  const { documentType } = useParams();
  const location = useLocation();
  const [formData, setFormData] = useState(null);
  const [htmlContent, setHtmlContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setLoading(true);
        setError(null);

        // Extract encoded data from URL query parameter
        const params = new URLSearchParams(location.search);
        const encodedData = params.get('data');

        if (!encodedData) {
          throw new Error('Не се пронајдени податоци во линкот');
        }

        // Decode and parse form data
        const decodedData = JSON.parse(decodeURIComponent(atob(encodedData)));
        setFormData(decodedData);

        // Fetch HTML preview from backend
        const response = await fetch(`${API_URL}/document-preview/${documentType}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ formData: decodedData })
        });

        if (!response.ok) {
          throw new Error('Грешка при генерирање на преглед');
        }

        const result = await response.json();
        setHtmlContent(result.html);
      } catch (err) {
        console.error('Error generating preview:', err);
        setError(err.message || 'Грешка при вчитување на документот. Линкот може да е неважечки.');
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [location, documentType, API_URL]);

  // Loading state
  if (loading) {
    return (
      <div className={styles.container}>
        {/* Nexa Top Navbar */}
        <div className={styles.topNavbar}>
          <div className={styles.navbarContent}>
            <span className={styles.navbarText}>Генерирано со </span>
            <a
              href="https://www.nexa.mk"
              target="_blank"
              rel="noopener noreferrer"
              // className={styles.navbarLink}
            >
              www.nexa.mk
            </a>
          </div>
        </div>

        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Се генерира преглед на документот...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.container}>
        {/* Nexa Top Navbar */}
        <div className={styles.topNavbar}>
          <div className={styles.navbarContent}>
            <span className={styles.navbarText}>Генерирано со</span>
            <a
              href="https://www.nexa.mk"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.navbarLink}
            >
              www.nexa.mk
            </a>
          </div>
        </div>

        <div className={styles.error}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2>Грешка</h2>
          <p className={styles.errorMessage}>{error}</p>
          <button
            onClick={() => window.close()}
            className={styles.closeButton}
          >
            Затвори
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Nexa Top Navbar */}
      <div className={styles.topNavbar}>
        <div className={styles.navbarContent}>
          <span className={styles.navbarText}>Генерирано со </span>
          <a
            href="https://www.nexa.mk"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.navbarLink}
          >
           Nexa
          </a>
        </div>
      </div>

      <div className={styles.content}>

        {/* Header */}
        <div className={styles.header}>
          <p className={styles.subtitle}>
            Предлог документ: {getDocumentTypeMacedonian(documentType)}
          </p>
        </div>

        {/* Document Content - Rendered from HTML */}
        <div className={styles.documentContent}>
          <div
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            className={styles.documentBody}
          />
        </div>

      </div>
    </div>
  );
};

export default DocumentPreviewPage;

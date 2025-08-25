import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import Header from '../../../../components/common/Header';
import Sidebar from '../../../../components/terminal/Sidebar';
import ProfileReminderBanner from '../../../../components/terminal/ProfileReminderBanner';
import DocumentStepProgress from '../../../../components/terminal/documents/DocumentStepProgress';
import DocumentPreview from '../../../../components/terminal/documents/DocumentPreview';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

const ConfirmationOfEmploymentPage = () => {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Employee Info (Step 1)
    fullName: '',
    position: '',
    employeeId: '',
    department: '',
    employmentStartDate: '',
    // Confirmation Details (Step 2)
    confirmationDate: new Date().toISOString().slice(0,10), // Default to today
    reasonForConfirmation: '', // e.g., For bank, For embassy, General purpose
    // company info (Step 3)
    companyName: '',
    companyAddress: '',
    companyRegistrationNumber: '',
    // Signatory (Step 3)
    managerName: '',
    managerPosition: '',
    additionalInfo: '', // Optional, moved to step 3 for better flow
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState({});

  const steps = [
    {
      id: 1,
      title: 'Податоци за вработен',
      description: 'Основни информации за вработениот',
      fields: ['fullName', 'position', 'employeeId', 'department', 'employmentStartDate']
    },
    {
      id: 2,
      title: 'Детали за потврда',
      description: 'Информации специфични за потврдата',
      fields: ['confirmationDate', 'reasonForConfirmation']
    },
    {
      id: 3,
      title: 'Податоци за компанија и потписник',
      description: 'Информации за компанијата и одговорното лице',
      fields: ['companyName', 'companyAddress', 'companyRegistrationNumber', 'managerName', 'managerPosition']
    }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateStep = (stepId) => {
    const step = steps.find(s => s.id === stepId);
    const stepErrors = {};
    
    step.fields.forEach(field => {
      if (!formData[field] || String(formData[field]).trim() === '') {
        stepErrors[field] = 'Ова поле е задолжително';
      }
    });

    // Additional specific validations can be added here if needed
    if (stepId === 1) {
        if (formData.employmentStartDate && new Date(formData.employmentStartDate) > new Date()) {
            stepErrors.employmentStartDate = 'Датумот на вработување не може да биде во иднина.';
        }
    }
    // Step 2 validation (confirmationDate) can remain as is or be adjusted
    // No new validation needed for step 3 for now, as fields are standard text.
    // If companyRegistrationNumber needs a specific format, add validation here.

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleGenerateDocument = async () => {
    if (!validateStep(currentStep)) return;
    if (currentStep !== steps.length) {
        setCurrentStep(steps.length);
        if (!validateStep(steps.length)) return;
    }

    setIsGenerating(true);
    try {
      // Updated to match AnnexEmploymentAgreement structure for requestBody
      const requestBody = {
        userId: currentUser._id, 
        formData: {
          fullName: formData.fullName,
          position: formData.position,
          employeeId: formData.employeeId,
          department: formData.department,
          employmentStartDate: formData.employmentStartDate,
          confirmationDate: formData.confirmationDate,
          reasonForConfirmation: formData.reasonForConfirmation,
          companyName: formData.companyName,
          companyAddress: formData.companyAddress,
          companyRegistrationNumber: formData.companyRegistrationNumber,
          managerName: formData.managerName,
          managerPosition: formData.managerPosition,
          additionalInfo: formData.additionalInfo,
        }
      };

      const response = await fetch('/api/documents/generate/confirmation-of-employment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Потврда_за_Вработување_${formData.fullName.replace(/\s+/g, '_')}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Грешка при генерирање на документот');
      }
    } catch (error) {
      console.error('Error generating document:', error);
      alert('Настана грешка при генерирање на документот. Ве молиме обидете се повторно.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Employee Info
        return (
          <div className={styles['step-content']}>
            <h3>Податоци за вработен</h3>
            <div className={styles['form-grid']}>
              <div className={styles['form-group']}>
                <label htmlFor="fullName">Име и презиме *</label>
                <input type="text" id="fullName" value={formData.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)} placeholder="Внесете име и презиме" className={errors.fullName ? styles.error : ''} />
                {errors.fullName && <span className={styles['error-message']}>{errors.fullName}</span>}
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="position">Работна позиција *</label>
                <input type="text" id="position" value={formData.position} onChange={(e) => handleInputChange('position', e.target.value)} placeholder="Внесете работна позиција" className={errors.position ? styles.error : ''} />
                {errors.position && <span className={styles['error-message']}>{errors.position}</span>}
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="employeeId">ID на вработен *</label>
                <input type="text" id="employeeId" value={formData.employeeId} onChange={(e) => handleInputChange('employeeId', e.target.value)} placeholder="Внесете ID на вработен" className={errors.employeeId ? styles.error : ''} />
                {errors.employeeId && <span className={styles['error-message']}>{errors.employeeId}</span>}
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="department">Оддел *</label>
                <input type="text" id="department" value={formData.department} onChange={(e) => handleInputChange('department', e.target.value)} placeholder="Внесете оддел" className={errors.department ? styles.error : ''} />
                {errors.department && <span className={styles['error-message']}>{errors.department}</span>}
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="employmentStartDate">Датум на вработување *</label>
                <input type="date" id="employmentStartDate" value={formData.employmentStartDate} onChange={(e) => handleInputChange('employmentStartDate', e.target.value)} className={errors.employmentStartDate ? styles.error : ''} />
                {errors.employmentStartDate && <span className={styles['error-message']}>{errors.employmentStartDate}</span>}
              </div>
            </div>
          </div>
        );
      case 2: // Confirmation Details
        return (
          <div className={styles['step-content']}>
            <h3>Детали за потврда</h3>
            <div className={styles['form-grid']}>
              <div className={styles['form-group']}>
                <label htmlFor="confirmationDate">Датум на издавање на потврда *</label>
                <input type="date" id="confirmationDate" value={formData.confirmationDate} onChange={(e) => handleInputChange('confirmationDate', e.target.value)} className={errors.confirmationDate ? styles.error : ''} />
                {errors.confirmationDate && <span className={styles['error-message']}>{errors.confirmationDate}</span>}
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="reasonForConfirmation">Причина за издавање *</label>
                <select 
                    id="reasonForConfirmation" 
                    value={formData.reasonForConfirmation} 
                    onChange={(e) => handleInputChange('reasonForConfirmation', e.target.value)} 
                    className={errors.reasonForConfirmation ? styles.error : ''}
                >
                    <option value="">Изберете причина</option>
                    <option value="За потребите на банка">За потребите на банка</option>
                    <option value="За потребите на амбасада/конзулат">За потребите на амбасада/конзулат</option>
                    <option value="Регулирање на престој">Регулирање на престој</option>
                    <option value="Општа намена">Општа намена</option>
                    <option value="Друго">Друго (наведете во дополнителни информации)</option>
                </select>
                {errors.reasonForConfirmation && <span className={styles['error-message']}>{errors.reasonForConfirmation}</span>}
              </div>
            </div>
          </div>
        );
      case 3: // Company and Signatory Info
        return (
          <div className={styles['step-content']}>
            <h3>Податоци за компанија и потписник</h3>
            <div className={styles['form-grid']}>
              <div className={styles['form-group']}>
                <label htmlFor="companyName">Име на компанија *</label>
                <input type="text" id="companyName" value={formData.companyName} onChange={(e) => handleInputChange('companyName', e.target.value)} placeholder="Внесете име на компанијата" className={errors.companyName ? styles.error : ''} />
                {errors.companyName && <span className={styles['error-message']}>{errors.companyName}</span>}
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="companyAddress">Адреса на компанија *</label>
                <input type="text" id="companyAddress" value={formData.companyAddress} onChange={(e) => handleInputChange('companyAddress', e.target.value)} placeholder="Внесете адреса на компанијата" className={errors.companyAddress ? styles.error : ''} />
                {errors.companyAddress && <span className={styles['error-message']}>{errors.companyAddress}</span>}
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="companyRegistrationNumber">Регистарски број на компанија *</label>
                <input type="text" id="companyRegistrationNumber" value={formData.companyRegistrationNumber} onChange={(e) => handleInputChange('companyRegistrationNumber', e.target.value)} placeholder="Внесете регистарски број" className={errors.companyRegistrationNumber ? styles.error : ''} />
                {errors.companyRegistrationNumber && <span className={styles['error-message']}>{errors.companyRegistrationNumber}</span>}
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="managerName">Име и презиме на овластено лице *</label>
                <input type="text" id="managerName" value={formData.managerName} onChange={(e) => handleInputChange('managerName', e.target.value)} placeholder="Внесете име на овластеното лице" className={errors.managerName ? styles.error : ''} />
                {errors.managerName && <span className={styles['error-message']}>{errors.managerName}</span>}
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="managerPosition">Позиција на овластено лице *</label>
                <input type="text" id="managerPosition" value={formData.managerPosition} onChange={(e) => handleInputChange('managerPosition', e.target.value)} placeholder="Внесете позиција на овластеното лице" className={errors.managerPosition ? styles.error : ''} />
                {errors.managerPosition && <span className={styles['error-message']}>{errors.managerPosition}</span>}
              </div>
              <div className={styles['form-group'] + ' ' + styles['full-width-group']}>
                <label htmlFor="additionalInfo">Дополнителни информации (опционално)</label>
                <textarea id="additionalInfo" value={formData.additionalInfo} onChange={(e) => handleInputChange('additionalInfo', e.target.value)} placeholder="Внесете дополнителни информации доколку е потребно" rows="3"></textarea>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`light-theme`}>
      <Header isTerminal={true} />
      <div className={styles['dashboard-layout']}>
        <Sidebar />
        <main className={styles['dashboard-main']}>
          <ProfileReminderBanner />
          
          <div className={styles['document-container']}>
            <div className={styles['document-header']}>
              <h1>Потврда за Вработување</h1>
              <p>Креирајте професионална потврда за вработување со повеќе чекори и генерирање на DOCX</p>
            </div>

            <DocumentStepProgress 
              steps={steps} 
              currentStep={currentStep}
              onStepClick={(stepId) => { // Allow clicking on steps only if they are already visited or the current one
                if (stepId <= currentStep || validateStep(currentStep -1)) { // Basic validation before allowing jump
                    setCurrentStep(stepId);
                }
              }}
            />

            <div className={styles['document-content']}>
              <div className={styles['form-section']}>
                {renderStepContent()}
                
                <div className={styles['step-navigation']}>
                  {currentStep > 1 && (
                    <button 
                      type="button" 
                      onClick={handlePrevStep}
                      className={styles['btn-secondary']}
                    >
                      ← Назад
                    </button>
                  )}
                  
                  {currentStep < steps.length ? (
                    <button 
                      type="button" 
                      onClick={handleNextStep}
                      className={styles['btn-primary']}
                    >
                      Следно →
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleGenerateDocument}
                      disabled={isGenerating}
                      className={styles['btn-generate']}
                    >
                      {isGenerating ? 'Се генерира...' : 'Генерирај документ'}
                    </button>
                  )}
                </div>
              </div>

              <div className={styles['preview-section']}>
                <DocumentPreview 
                  documentType="confirmationOfEmployment" 
                  formData={formData}
                  currentStep={currentStep} // Pass currentStep to DocumentPreview
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ConfirmationOfEmploymentPage;

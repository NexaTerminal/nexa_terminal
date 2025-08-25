import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import Header from '../../../../components/common/Header';
import Sidebar from '../../../../components/terminal/Sidebar';
import ProfileReminderBanner from '../../../../components/terminal/ProfileReminderBanner';
import DocumentStepProgress from '../../../../components/terminal/documents/DocumentStepProgress';
import DocumentPreview from '../../../../components/terminal/documents/DocumentPreview';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

const AnnexEmploymentAgreement = () => {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Employee Info (Step 1)
    fullName: '',
    position: '',
    employeeId: '',
    department: '',
    email: '',
    phone: '',
    
    // Agreement Info (Step 2)
    agreementType: '',
    effectiveDate: '',
    duration: '',
    compensation: '',
    benefits: '',
    specialTerms: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState({});

  const steps = [
    {
      id: 1,
      title: 'Податоци за вработен',
      description: 'Основни информации за вработениот',
      fields: ['fullName', 'position', 'employeeId', 'department', 'email', 'phone']
    },
    {
      id: 2,
      title: 'Информации за договор',
      description: 'Детали за договорот за вработување',
      fields: ['agreementType', 'effectiveDate', 'duration', 'compensation', 'benefits', 'specialTerms']
    }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
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
      if (!formData[field] || formData[field].trim() === '') {
        stepErrors[field] = 'Ова поле е задолжително';
      }
    });

    // Additional validations
    if (stepId === 1) {
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        stepErrors.email = 'Внесете валидна е-маил адреса';
      }
      if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
        stepErrors.phone = 'Внесете валиден телефонски број';
      }
    }

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
    // Ensure all steps are validated before final generation if needed
    if (currentStep !== steps.length) {
        setCurrentStep(steps.length); // Move to final step
        if (!validateStep(steps.length)) return; // Validate the final step
    }

    setIsGenerating(true);
    try {
      // Consolidate formData as expected by the backend
      const requestBody = {
        userId: currentUser._id, // Include the userId
        formData: {
          // Employee Info
          fullName: formData.fullName,
          position: formData.position,
          employeeId: formData.employeeId,
          department: formData.department,
          email: formData.email,
          phone: formData.phone,
          // Agreement Info
          agreementType: formData.agreementType,
          effectiveDate: formData.effectiveDate,
          duration: formData.duration,
          compensation: formData.compensation,
          benefits: formData.benefits,
          specialTerms: formData.specialTerms,
          // Include any other fields that might be part of the enrichedFormData on the backend
          // or are directly used by generateAnnexEmploymentAgreementDoc
          // For example, if managerName and managerPosition are expected from the form:
          managerName: formData.managerName || '', // Assuming these might be in your formData state
          managerPosition: formData.managerPosition || '' // Or set default if applicable
        }
      };

      const response = await fetch('/api/documents/generate/employment-annex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody) // Send the corrected requestBody
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Анекс_Договор_за_Вработување_${formData.fullName.replace(/\\s+/g, '_')}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const responseText = await response.text(); // Get raw response text
        console.error('Server responded with non-OK status:', response.status, responseText); // Log status and raw text

        try {
          const errorData = JSON.parse(responseText); // Attempt to parse as JSON
          throw new Error(errorData.message || 'Грешка при генерирање на документот');
        } catch (e) {
          console.error('Failed to parse server error response as JSON:', e);
          // Check if the response text looks like HTML
          if (responseText.trim().startsWith('<!DOCTYPE html>') || responseText.trim().startsWith('<html>')) {
            throw new Error('Серверот врати HTML грешка наместо JSON. Проверете ја конзолата на прелистувачот и логовите на серверот за детали.');
          }
          throw new Error('Грешка при парсирање на одговорот од серверот. Проверете ја конзолата на прелистувачот.');
        }
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
      case 1:
        return (
          <div className={styles['step-content']}>
            <h3>Податоци за вработен</h3>
            <div className={styles['form-grid']}>
              <div className={styles['form-group']}>
                <label htmlFor="fullName">Име и презиме *</label>
                <input
                  type="text"
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Внесете име и презиме на вработениот"
                  className={errors.fullName ? styles.error : ''}
                />
                {errors.fullName && <span className={styles['error-message']}>{errors.fullName}</span>}
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="position">Работна позиција *</label>
                <input
                  type="text"
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  placeholder="Внесете работна позиција"
                  className={errors.position ? styles.error : ''}
                />
                {errors.position && <span className={styles['error-message']}>{errors.position}</span>}
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="employeeId">ID на вработен *</label>
                <input
                  type="text"
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => handleInputChange('employeeId', e.target.value)}
                  placeholder="Внесете ID на вработен"
                  className={errors.employeeId ? styles.error : ''}
                />
                {errors.employeeId && <span className={styles['error-message']}>{errors.employeeId}</span>}
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="department">Оддел *</label>
                <input
                  type="text"
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="Внесете оддел"
                  className={errors.department ? styles.error : ''}
                />
                {errors.department && <span className={styles['error-message']}>{errors.department}</span>}
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="email">Е-маил *</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Внесете е-маил на вработениот"
                  className={errors.email ? styles.error : ''}
                />
                {errors.email && <span className={styles['error-message']}>{errors.email}</span>}
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="phone">Телефон *</label>
                <input
                  type="text"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Внесете телефонски број на вработениот"
                  className={errors.phone ? styles.error : ''}
                />
                {errors.phone && <span className={styles['error-message']}>{errors.phone}</span>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className={styles['step-content']}>
            <h3>Информации за договор</h3>
            <div className={styles['form-grid']}>
              <div className={styles['form-group']}>
                <label htmlFor="agreementType">Тип на договор *</label>
                <select
                  id="agreementType"
                  value={formData.agreementType}
                  onChange={(e) => handleInputChange('agreementType', e.target.value)}
                  className={errors.agreementType ? styles.error : ''}
                >
                  <option value="">Изберете тип на договор</option>
                  <option value="Contract Extension">Продолжување на договор</option>
                  <option value="Salary Amendment">Измена на плата</option>
                  <option value="Position Change">Промена на работна позиција</option>
                  <option value="Department Transfer">Трансфер во друг оддел</option>
                  <option value="Working Hours Modification">Измена на работно време</option>
                  <option value="Benefits Amendment">Измена на бенефиции</option>
                  <option value="Other">Друго</option>
                </select>
                {errors.agreementType && <span className={styles['error-message']}>{errors.agreementType}</span>}
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="effectiveDate">Датум на важност *</label>
                <input
                  type="date"
                  id="effectiveDate"
                  value={formData.effectiveDate}
                  onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                  className={errors.effectiveDate ? styles.error : ''}
                />
                {errors.effectiveDate && <span className={styles['error-message']}>{errors.effectiveDate}</span>}
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="duration">Времетраење *</label>
                <input
                  type="text"
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="пр. 12 месеци, Неопределено, До 31 Дек, 2025"
                  className={errors.duration ? styles.error : ''}
                />
                {errors.duration && <span className={styles['error-message']}>{errors.duration}</span>}
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="compensation">Плата/Надоместок *</label>
                <input
                  type="text"
                  id="compensation"
                  value={formData.compensation}
                  onChange={(e) => handleInputChange('compensation', e.target.value)}
                  placeholder="пр. 30000 МКД месечно, 360000 МКД годишно"
                  className={errors.compensation ? styles.error : ''}
                />
                {errors.compensation && <span className={styles['error-message']}>{errors.compensation}</span>}
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="benefits">Бенефиции *</label>
                <textarea
                  id="benefits"
                  value={formData.benefits}
                  onChange={(e) => handleInputChange('benefits', e.target.value)}
                  placeholder="Наведете ги бенефициите (здравствено осигурување, денови за одмор, итн.)"
                  rows="3"
                  className={errors.benefits ? styles.error : ''}
                />
                {errors.benefits && <span className={styles['error-message']}>{errors.benefits}</span>}
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="specialTerms">Посебни услови *</label>
                <textarea
                  id="specialTerms"
                  value={formData.specialTerms}
                  onChange={(e) => handleInputChange('specialTerms', e.target.value)}
                  placeholder="Било какви посебни услови или одредби за овој договор"
                  rows="4"
                  className={errors.specialTerms ? styles.error : ''}
                />
                {errors.specialTerms && <span className={styles['error-message']}>{errors.specialTerms}</span>}
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
              <h1>Анекс на Договор за Вработување</h1>
              <p>Креирајте професионален анекс на договор за вработување со повеќе чекори и генерирање на DOCX</p>
            </div>

            <DocumentStepProgress 
              steps={steps} 
              currentStep={currentStep}
              onStepClick={setCurrentStep}
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
                  documentType="annexEmploymentAgreement" // Corrected: Changed to camelCase
                  formData={formData}
                  currentStep={currentStep}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AnnexEmploymentAgreement;

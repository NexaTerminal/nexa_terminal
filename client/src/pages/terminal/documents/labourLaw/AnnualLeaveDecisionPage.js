import React, { useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import Header from '../../../../components/common/Header';
import Sidebar from '../../../../components/terminal/Sidebar';
import ProfileReminderBanner from '../../../../components/terminal/ProfileReminderBanner';
import DocumentStepProgress from '../../../../components/terminal/documents/DocumentStepProgress';
import DocumentPreview from '../../../../components/terminal/documents/DocumentPreview';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

const AnnualLeaveDecisionPage = () => {
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
    
    // Leave Details (Step 2)
    leaveYear: '',
    leaveStartDate: '',
    leaveEndDate: '',
    totalLeaveDays: '',
    remainingLeaveDays: '',
    reasonForLeave: '',
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
      title: 'Детали за годишен одмор',
      description: 'Информации за периодот и деновите на одмор',
      fields: ['leaveYear', 'leaveStartDate', 'leaveEndDate', 'totalLeaveDays', 'remainingLeaveDays', 'reasonForLeave']
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

    if (stepId === 2) {
      if (formData.leaveStartDate && formData.leaveEndDate && new Date(formData.leaveStartDate) > new Date(formData.leaveEndDate)) {
        stepErrors.leaveEndDate = 'Крајниот датум не може да биде пред почетниот датум';
      }
      if (formData.totalLeaveDays && isNaN(Number(formData.totalLeaveDays))) {
        stepErrors.totalLeaveDays = 'Внесете валиден број на денови';
      }
      if (formData.leaveYear && (isNaN(Number(formData.leaveYear)) || String(formData.leaveYear).length !== 4)) {
        stepErrors.leaveYear = 'Внесете валидна година (пр. 2024)';
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
    if (currentStep !== steps.length) {
        setCurrentStep(steps.length);
        if (!validateStep(steps.length)) return;
    }

    setIsGenerating(true);
    try {
      const requestBody = {
        userId: currentUser._id,
        formData: {
          // Employee Info
          fullName: formData.fullName,
          position: formData.position,
          employeeId: formData.employeeId,
          department: formData.department,
          email: formData.email,
          phone: formData.phone,
          // Leave Details
          leaveYear: formData.leaveYear,
          leaveStartDate: formData.leaveStartDate,
          leaveEndDate: formData.leaveEndDate,
          totalLeaveDays: formData.totalLeaveDays,
          remainingLeaveDays: formData.remainingLeaveDays,
          reasonForLeave: formData.reasonForLeave,
        }
      };

      const response = await fetch('/api/documents/generate/annual-leave-decision', {
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
        link.download = `Решение_Годишен_Одмор_${formData.fullName.replace(/\s+/g, '_')}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const responseText = await response.text();
        console.error('Server responded with non-OK status:', response.status, responseText);
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || 'Грешка при генерирање на документот');
        } catch (e) {
          throw new Error('Настана грешка при генерирање на документот');
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
            <h3>Детали за годишен одмор</h3>
            <div className={styles['form-grid']}>
              <div className={styles['form-group']}>
                <label htmlFor="leaveYear">Година на одмор *</label>
                <input
                  type="number"
                  id="leaveYear"
                  value={formData.leaveYear}
                  onChange={(e) => handleInputChange('leaveYear', e.target.value)}
                  placeholder="пр. 2024"
                  className={errors.leaveYear ? styles.error : ''}
                />
                {errors.leaveYear && <span className={styles['error-message']}>{errors.leaveYear}</span>}
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="leaveStartDate">Датум на почеток *</label>
                <input
                  type="date"
                  id="leaveStartDate"
                  value={formData.leaveStartDate}
                  onChange={(e) => handleInputChange('leaveStartDate', e.target.value)}
                  className={errors.leaveStartDate ? styles.error : ''}
                />
                {errors.leaveStartDate && <span className={styles['error-message']}>{errors.leaveStartDate}</span>}
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="leaveEndDate">Датум на завршување *</label>
                <input
                  type="date"
                  id="leaveEndDate"
                  value={formData.leaveEndDate}
                  onChange={(e) => handleInputChange('leaveEndDate', e.target.value)}
                  className={errors.leaveEndDate ? styles.error : ''}
                />
                {errors.leaveEndDate && <span className={styles['error-message']}>{errors.leaveEndDate}</span>}
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="totalLeaveDays">Вкупно денови одмор *</label>
                <input
                  type="number"
                  id="totalLeaveDays"
                  value={formData.totalLeaveDays}
                  onChange={(e) => handleInputChange('totalLeaveDays', e.target.value)}
                  placeholder="Внесете вкупен број на денови"
                  className={errors.totalLeaveDays ? styles.error : ''}
                />
                {errors.totalLeaveDays && <span className={styles['error-message']}>{errors.totalLeaveDays}</span>}
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="remainingLeaveDays">Преостанати денови *</label>
                <input
                  type="number"
                  id="remainingLeaveDays"
                  value={formData.remainingLeaveDays}
                  onChange={(e) => handleInputChange('remainingLeaveDays', e.target.value)}
                  placeholder="Внесете преостанати денови"
                  className={errors.remainingLeaveDays ? styles.error : ''}
                />
                {errors.remainingLeaveDays && <span className={styles['error-message']}>{errors.remainingLeaveDays}</span>}
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="reasonForLeave">Причина за одмор *</label>
                <textarea
                  id="reasonForLeave"
                  value={formData.reasonForLeave}
                  onChange={(e) => handleInputChange('reasonForLeave', e.target.value)}
                  placeholder="Наведете причина за одморот (пр. редовен годишен одмор, породилно отсуство, итн.)"
                  rows="3"
                  className={errors.reasonForLeave ? styles.error : ''}
                />
                {errors.reasonForLeave && <span className={styles['error-message']}>{errors.reasonForLeave}</span>}
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
              <h1>Решение за Годишен Одмор</h1>
              <p>Креирајте професионално решение за годишен одмор со повеќе чекори и генерирање на DOCX</p>
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
                  documentType="annualLeaveDecision"
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

export default AnnualLeaveDecisionPage;

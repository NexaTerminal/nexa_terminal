import React, { useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';
import DocumentPreview from '../../../../components/terminal/documents/DocumentPreview';

const EmploymentAgreementPage = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeAddress: '',
    employeePIN: '',
    jobPosition: '',
    workTasks: [''],
    netSalary: '',
    placeOfWork: 'просториите на седиштето на работодавачот',
    otherWorkPlace: '',
    agreementDate: '',
    agreementDurationType: 'неопределено времетраење.',
    definedDuration: '',
    dailyWorkTime: 'започнува од 08:00 часот, а завршува во 16:00 часот',
    otherWorkTime: '',
    concurrentClause: false,
    concurrentClauseInput: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWorkTaskChange = (index, value) => {
    const newWorkTasks = [...formData.workTasks];
    newWorkTasks[index] = value;
    setFormData(prev => ({
      ...prev,
      workTasks: newWorkTasks
    }));
  };

  const addWorkTask = () => {
    setFormData(prev => ({
      ...prev,
      workTasks: [...prev.workTasks, '']
    }));
  };

  const removeWorkTask = (index) => {
    if (formData.workTasks.length > 1) {
      const newWorkTasks = formData.workTasks.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        workTasks: newWorkTasks
      }));
    }
  };

  const validateStep1 = () => {
    return formData.employeeName && formData.employeeAddress && formData.employeePIN && formData.jobPosition && formData.workTasks[0];
  };

  const validateStep2 = () => {
    return formData.netSalary && formData.agreementDate;
  };

  const validateStep3 = () => {
    if (formData.placeOfWork === 'Друго место' && !formData.otherWorkPlace) return false;
    if (formData.agreementDurationType === 'определено времетраење' && !formData.definedDuration) return false;
    if (formData.dailyWorkTime === 'other' && !formData.otherWorkTime) return false;
    if (formData.concurrentClause && !formData.concurrentClauseInput) return false;
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    } else if (currentStep === 3 && validateStep3()) {
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('Ве молиме најавете се за да продолжите.');
      return;
    }

    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      setError('Ве молиме пополнете ги сите задолжителни полиња.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/auto-documents/employment-agreement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ formData })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'employment-agreement.docx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Настана грешка при генерирањето на документот.');
      }
    } catch (error) {
      setError('Настана грешка при генерирањето на документот.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className={styles.formStep}>
      <h3>Основни податоци за работникот</h3>
      
      <div className={styles.formGroup}>
        <label>Име и презиме на работникот *</label>
        <input
          type="text"
          value={formData.employeeName}
          onChange={(e) => handleInputChange('employeeName', e.target.value)}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label>Адреса на седиште на работникот (улица, број и град) *</label>
        <input
          type="text"
          value={formData.employeeAddress}
          onChange={(e) => handleInputChange('employeeAddress', e.target.value)}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label>ЕМБГ на работникот *</label>
        <input
          type="text"
          value={formData.employeePIN}
          onChange={(e) => handleInputChange('employeePIN', e.target.value)}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label>Назив на работна позиција *</label>
        <input
          type="text"
          value={formData.jobPosition}
          onChange={(e) => handleInputChange('jobPosition', e.target.value)}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label>Работни обврски *</label>
        {formData.workTasks.map((task, index) => (
          <div key={index} className={styles.arrayField}>
            <input
              type="text"
              placeholder="Работна обврска"
              value={task}
              onChange={(e) => handleWorkTaskChange(index, e.target.value)}
              required
            />
            {formData.workTasks.length > 1 && (
              <button type="button" onClick={() => removeWorkTask(index)} className={styles.removeBtn}>
                Отстрани
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addWorkTask} className={styles.addBtn}>
          Додади обврска на работникот
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className={styles.formStep}>
      <h3>Плата и датум на договор</h3>
      
      <div className={styles.formGroup}>
        <label>Основна плата *</label>
        <input
          type="number"
          value={formData.netSalary}
          onChange={(e) => handleInputChange('netSalary', e.target.value)}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label>Датум на склучување на договор за вработување *</label>
        <input
          type="date"
          value={formData.agreementDate}
          onChange={(e) => handleInputChange('agreementDate', e.target.value)}
          required
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className={styles.formStep}>
      <h3>Работни услови</h3>
      
      <div className={styles.formGroup}>
        <label>Место на вршење на работата</label>
        <select
          value={formData.placeOfWork}
          onChange={(e) => handleInputChange('placeOfWork', e.target.value)}
        >
          <option value="просториите на седиштето на работодавачот">Седиштето на работодавачот</option>
          <option value="Друго место">Друго место</option>
        </select>
      </div>

      {formData.placeOfWork === 'Друго место' && (
        <div className={styles.formGroup}>
          <label>Наведете го местото на вршење на работите *</label>
          <input
            type="text"
            value={formData.otherWorkPlace}
            onChange={(e) => handleInputChange('otherWorkPlace', e.target.value)}
            required
          />
        </div>
      )}

      <div className={styles.formGroup}>
        <label>Времетраење на договорот за вработување</label>
        <select
          value={formData.agreementDurationType}
          onChange={(e) => handleInputChange('agreementDurationType', e.target.value)}
        >
          <option value="неопределено времетраење.">Неопределено времетрање</option>
          <option value="определено времетраење">Определено времетрање</option>
        </select>
      </div>

      {formData.agreementDurationType === 'определено времетраење' && (
        <div className={styles.formGroup}>
          <label>Наведете го последниот ден на работа на работникот *</label>
          <input
            type="date"
            value={formData.definedDuration}
            onChange={(e) => handleInputChange('definedDuration', e.target.value)}
            required
          />
        </div>
      )}

      <div className={styles.formGroup}>
        <label>Дневно работно време</label>
        <select
          value={formData.dailyWorkTime}
          onChange={(e) => handleInputChange('dailyWorkTime', e.target.value)}
        >
          <option value="започнува од 08:00 часот, а завршува во 16:00 часот">08:00 - 16:00</option>
          <option value="започнува од 08:30 часот, а завршува во 16:30 часот">08:30 - 16:30</option>
          <option value="започнува од 09:00 часот, а завршува во 17:00 часот">09:00 - 17:00</option>
          <option value="се определува согласно распоред за работно време">Се определува согласно распоред за работно време</option>
          <option value="other">Друго</option>
        </select>
      </div>

      {formData.dailyWorkTime === 'other' && (
        <div className={styles.formGroup}>
          <label>Наведете го дневното работно време на работникот *</label>
          <input
            type="text"
            value={formData.otherWorkTime}
            onChange={(e) => handleInputChange('otherWorkTime', e.target.value)}
            required
          />
        </div>
      )}

      <div className={styles.formGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.concurrentClause}
            onChange={(e) => handleInputChange('concurrentClause', e.target.checked)}
          />
          Конкурентска клаузула
        </label>
      </div>

      {formData.concurrentClause && (
        <div className={styles.formGroup}>
          <label>Времетраење на конкурентска клаузула *</label>
          <textarea
            value={formData.concurrentClauseInput}
            onChange={(e) => handleInputChange('concurrentClauseInput', e.target.value)}
            rows="3"
            required
          />
        </div>
      )}
    </div>
  );

  const renderPreview = () => (
    <div className={styles.formStep}>
      <h3>Преглед на документот</h3>
      <DocumentPreview 
        formData={formData} 
        documentType="employmentAgreement" 
        currentStep={currentStep}
      />
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Договор за вработување</h1>
        <div className={styles.stepIndicator}>
          Чекор {currentStep} од 4
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderPreview()}

          <div className={styles.navigation}>
            {currentStep > 1 && (
              <button 
                type="button" 
                onClick={handleBack}
                className={styles.backBtn}
              >
                Назад
              </button>
            )}
            
            {currentStep < 4 ? (
              <button 
                type="button" 
                onClick={handleNext}
                className={styles.nextBtn}
                disabled={
                  (currentStep === 1 && !validateStep1()) ||
                  (currentStep === 2 && !validateStep2()) ||
                  (currentStep === 3 && !validateStep3())
                }
              >
                Следно
              </button>
            ) : (
              <button 
                type="submit" 
                className={styles.submitBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Се генерира документот...' : 'Генерирај документ'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmploymentAgreementPage;
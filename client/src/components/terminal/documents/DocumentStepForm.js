import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import DocumentStepProgress from './DocumentStepProgress';
import DocumentPreview from './DocumentPreview';
import styles from '../../../styles/terminal/documents/DocumentGeneration.module.css';

const DocumentStepForm = ({ template, categoryColor, onSuccess, onError }) => {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Group fields into steps
  const steps = organizeFieldsIntoSteps(template.fields);

  useEffect(() => {
    if (template && template.fields) {
      const initialFormData = template.fields.reduce((acc, field) => {
        acc[field.name] = field.defaultValue || '';
        return acc;
      }, {});
      setFormData(initialFormData);
    }
  }, [template]);

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
    
    step.fields.forEach(fieldName => {
      const field = template.fields.find(f => f.name === fieldName);
      if (field.required && (!formData[fieldName] || formData[fieldName].toString().trim() === '')) {
        stepErrors[fieldName] = 'Ова поле е задолжително';
      }
      
      // Specific validations based on field types
      if (formData[fieldName]) {
        if (field.type === 'email' && !/\S+@\S+\.\S+/.test(formData[fieldName])) {
          stepErrors[fieldName] = 'Внесете валидна е-маил адреса';
        }
        if (field.type === 'number' && isNaN(Number(formData[fieldName]))) {
          stepErrors[fieldName] = 'Внесете валиден број';
        }
      }
    });

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
    setIsSubmitting(true);

    try {
      const userId = currentUser?._id;
      if (!userId) {
        throw new Error('Корисникот не е најавен');
      }

      const response = await fetch(template.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          formData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Грешка при генерирање на документ: ${response.statusText}`);
      }

      // Handle document download
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 
                       `${template.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.docx`;
        
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      }

      if (onSuccess) {
        onSuccess('Документот е успешно генериран и преземањето започна.');
      }

    } catch (error) {
      console.error('Document generation error:', error);
      if (onError) {
        onError(error.message || 'Настана грешка при генерирање на документот.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field) => {
    const fieldConfig = template.fields.find(f => f.name === field);
    if (!fieldConfig) return null;

    const commonProps = {
      name: fieldConfig.name,
      id: fieldConfig.name,
      value: formData[fieldConfig.name] || '',
      onChange: (e) => handleInputChange(fieldConfig.name, e.target.value),
      className: errors[fieldConfig.name] ? `${styles.formInput} ${styles.errorInput}` : styles.formInput,
      required: fieldConfig.required,
      placeholder: fieldConfig.placeholder || '',
    };

    let inputElement;
    switch (fieldConfig.type) {
      case 'textarea':
        inputElement = <textarea {...commonProps} rows="3" />;
        break;
      case 'select':
        inputElement = (
          <select {...commonProps}>
            <option value="">Изберете опција</option>
            {fieldConfig.options && fieldConfig.options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
        break;
      case 'date':
        inputElement = <input type="date" {...commonProps} />;
        break;
      case 'number':
        inputElement = <input type="number" {...commonProps} />;
        break;
      case 'email':
        inputElement = <input type="email" {...commonProps} />;
        break;
      default: // text
        inputElement = <input type="text" {...commonProps} />;
    }

    return (
      <div key={fieldConfig.name} className={styles.formGroup}>
        <label htmlFor={fieldConfig.name} className={styles.formLabel}>
          {fieldConfig.label}
          {fieldConfig.required && <span className={styles.requiredMark}>*</span>}
        </label>
        {inputElement}
        {errors[fieldConfig.name] && <div className={styles.errorMessage}>{errors[fieldConfig.name]}</div>}
        {fieldConfig.tooltip && <div className={styles.fieldTooltip}>{fieldConfig.tooltip}</div>}
      </div>
    );
  };

  const renderCurrentStepForm = () => {
    const currentStepData = steps.find(step => step.id === currentStep);
    
    return (
      <div className={styles.stepContent}>
        <h3>{currentStepData.title}</h3>
        <p className={styles.stepDescription}>{currentStepData.description}</p>
        
        <div className={styles.formGrid}>
          {currentStepData.fields.map(field => renderField(field))}
        </div>
        
        <div className={styles.formActions}>
          {currentStep > 1 && (
            <button type="button" onClick={handlePrevStep} className={styles.prevButton}>
              Назад
            </button>
          )}
          {currentStep < steps.length ? (
            <button type="button" onClick={handleNextStep} className={styles.nextButton}
              style={{backgroundColor: categoryColor}}>
              Следно
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handleGenerateDocument} 
              className={styles.generateButton}
              style={{backgroundColor: categoryColor}}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Генерирање...' : 'Генерирај Документ'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.documentContent}>
      <div className={styles.formSection}>
        <DocumentStepProgress steps={steps.map(s => s.title)} currentStep={currentStep} />
        {renderCurrentStepForm()}
      </div>
      <div className={styles.previewSection}>
        <DocumentPreview 
          formData={formData} 
          documentType={template.id} 
          currentStep={currentStep}
        />
      </div>
    </div>
  );
};

// Helper function to organize fields into steps
function organizeFieldsIntoSteps(fields) {
  // Define logical step groupings based on field types
  const basicInfoFields = fields.filter(f => 
    f.name.includes('name') || 
    f.name.includes('id') || 
    f.name.includes('email') || 
    f.name.includes('address') ||
    f.name.includes('position') ||
    f.name.includes('phone')
  ).map(f => f.name);
  
  const documentDetailsFields = fields.filter(f => 
    f.name.includes('date') || 
    f.name.includes('salary') || 
    f.name.includes('type') || 
    f.name.includes('duration') ||
    f.name.includes('contract') ||
    f.name.includes('number') ||
    f.name.includes('reason')
  ).map(f => f.name);
  
  // Catch any remaining fields
  const additionalFields = fields
    .filter(f => !basicInfoFields.includes(f.name) && !documentDetailsFields.includes(f.name))
    .map(f => f.name);
  
  // Create steps
  const steps = [
    {
      id: 1,
      title: 'Основни Информации',
      description: 'Внесете ги основните информации потребни за документот',
      fields: basicInfoFields.length ? basicInfoFields : fields.slice(0, Math.ceil(fields.length / 2)).map(f => f.name)
    }
  ];
  
  // Add second step if we have fields for it
  if (documentDetailsFields.length || additionalFields.length) {
    steps.push({
      id: 2,
      title: 'Детали за Документот',
      description: 'Внесете ги специфичните детали за документот',
      fields: documentDetailsFields.length ? 
        documentDetailsFields : 
        additionalFields.length ? additionalFields : fields.slice(Math.ceil(fields.length / 2)).map(f => f.name)
    });
  }
  
  // Add third step if we have additional fields and already used the first two categories
  if (additionalFields.length && documentDetailsFields.length) {
    steps.push({
      id: 3,
      title: 'Дополнителни Информации',
      description: 'Внесете дополнителни информации за документот',
      fields: additionalFields
    });
  }
  
  return steps;
}

export default DocumentStepForm;

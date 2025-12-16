import React, { useState } from "react";
import BaseDocumentPage from "../../../../components/documents/BaseDocumentPage";
import FormField from "../../../../components/forms/FormField";
import politicsForDataProtectionConfig from "../../../../config/documents/politicsForDataProtection";
import styles from "../../../../styles/terminal/documents/DocumentGeneration.module.css";
import personalDataGroups from "../../../../data/personalDataGroups.json";

const PoliticsForDataProtectionPage = () => {
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  const toggleDescription = (index) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleDataGroupToggle = (group, formData, handleInputChange) => {
    const currentGroups = formData.dataGroups || [];
    const isSelected = currentGroups.some(g => g.type === group.type);

    if (isSelected) {
      handleInputChange('dataGroups', currentGroups.filter(g => g.type !== group.type));
    } else {
      handleInputChange('dataGroups', [...currentGroups, group]);
    }
  };

  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const step = politicsForDataProtectionConfig.steps.find(s => s.id === currentStep);

    if (!step) return null;

    return (
      <div className={styles['form-section']}>
        <h3>{step.title}</h3>
        {step.description && <p className={styles['step-description']}>{step.description}</p>}

        {/* Effective Date Field */}
        <FormField
          field={step.fields[0]}
          value={formData.effectiveDate}
          formData={formData}
          onChange={handleInputChange}
          error={errors.effectiveDate}
          disabled={isGenerating}
        />

        {/* Data Groups Checkbox Group - Custom rendering */}
        <div className={styles['form-group']}>
          <label>
            {step.fields[1].label}
            <span className={styles['help-tooltip']} data-tooltip={step.fields[1].helpText}>
              ❓
            </span>
          </label>

          <div className={styles['checkbox-grid']}>
            {personalDataGroups.map((group, index) => {
              const isSelected = formData.dataGroups?.some(g => g.type === group.type) || false;
              const isExpanded = expandedDescriptions[index] || false;

              return (
                <div key={index} className={styles['checkbox-card']}>
                  <div className={styles['checkbox-header']}>
                    <div className={styles['checkbox-left']}>
                      <input
                        type="checkbox"
                        id={`group_${index}`}
                        checked={isSelected}
                        onChange={() => handleDataGroupToggle(group, formData, handleInputChange)}
                        disabled={isGenerating}
                      />
                      <label htmlFor={`group_${index}`} className={styles['checkbox-title']}>
                        {group.type}
                      </label>
                    </div>
                    <button
                      type="button"
                      className={styles['expand-button']}
                      onClick={() => toggleDescription(index)}
                      aria-label={isExpanded ? "Hide description" : "Show description"}
                    >
                      <span className={`${styles['expand-icon']} ${isExpanded ? styles['expanded'] : ''}`}>
                        ▼
                      </span>
                    </button>
                  </div>
                  <div className={`${styles['checkbox-description']} ${isExpanded ? styles['expanded'] : ''}`}>
                    {group.description}
                  </div>
                </div>
              );
            })}
          </div>

          {formData.dataGroups && formData.dataGroups.length > 0 && (
            <div className={styles['selected-summary']}>
              <strong>Избрани категории:</strong> {formData.dataGroups.length}
            </div>
          )}

          {errors.dataGroups && (
            <span className={styles['error-message']}>
              {errors.dataGroups}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <BaseDocumentPage
      config={politicsForDataProtectionConfig}
      renderStepContent={renderStepContent}
      title="Политика за заштита на лични податоци"
      description="Создавање на политика за заштита на лични податоци со избор на применливи категории податоци"
    />
  );
};

export default PoliticsForDataProtectionPage;
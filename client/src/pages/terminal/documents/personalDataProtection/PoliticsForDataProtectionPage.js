import React, { useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import Header from "../../../../components/common/Header";
import Sidebar from "../../../../components/terminal/Sidebar";
import ProfileReminderBanner from "../../../../components/terminal/ProfileReminderBanner";
import DocumentPreview from "../../../../components/terminal/documents/DocumentPreview";
import FormField from "../../../../components/forms/FormField";
import styles from "../../../../styles/terminal/documents/DocumentGeneration.module.css";
import personalDataGroups from "../../../../data/personalDataGroups.json";

const PoliticsForDataProtectionPage = () => {
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    effectiveDate: "",
    dataGroups: []
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleDataGroupToggle = (group) => {
    setFormData(prev => {
      const currentGroups = prev.dataGroups || [];
      const isSelected = currentGroups.some(g => g.type === group.type);
      
      if (isSelected) {
        // Remove group
        return {
          ...prev,
          dataGroups: currentGroups.filter(g => g.type !== group.type)
        };
      } else {
        // Add group
        return {
          ...prev,
          dataGroups: [...currentGroups, group]
        };
      }
    });
  };

  const toggleDescription = (index) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    // No required validation - allow empty generation
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerateDocument = async () => {
    if (!validateForm()) return;

    if (!currentUser) {
      alert("Мора да бидете најавени за да генерирате документ.");
      return;
    }

    setIsGenerating(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch('/api/auto-documents/politics-for-data-protection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ formData })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to generate document';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use the text as error message
        }
        
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'politics-for-data-protection.docx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('Document downloaded successfully!');
      setError(null);
    } catch (error) {
      setError(error.message);
      setSuccess(null);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Header isTerminal={true} />
      <div className={styles.dashboardLayout}>
        <Sidebar />
        <main className={styles.dashboardMain}>
          {!currentUser?.profileComplete && <ProfileReminderBanner />}

          {/* Split layout with form and preview */}
          <div className={styles.splitLayout}>
            {/* Form Section */}
            <div className={styles.formSection}>
              <div className={styles["form-sections"]}>
                <div className={styles["form-section"]}>
                  <h2>Политика за заштита на лични податоци</h2>
                  <p>Создавање на политика за заштита на лични податоци со избор на применливи категории податоци</p>

                  {/* Effective Date Field */}
                  <FormField
                    field={{
                      name: 'effectiveDate',
                      type: 'date',
                      label: 'Датум на влегување во сила',
                      required: false,
                      helpText: 'Изберете го датумот кога политиката за заштита на лични податоци официјално ќе влезе во сила во вашата компанија. Ова е правно значајниот датум за почеток на примена на политиката.'
                    }}
                    value={formData.effectiveDate}
                    onChange={handleInputChange}
                    error={errors.effectiveDate}
                  />

                  {/* Data Groups Checkbox Group */}
                  <div className={styles['form-group']}>
                    <label>
                      Категории на лични податоци кои ги обработува компанијата
                      <span className={styles['help-tooltip']} data-tooltip="Изберете ги категориите на лични податоци кои вашата компанија ги обработува во рамките на својата деловна активност. Оваа информација е задолжителна за правилно дефинирање на обемот на политиката според GDPR и домашната легислатива за заштита на лични податоци.">
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
                                  onChange={() => handleDataGroupToggle(group)}
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
              </div>

              {error && (
                <div className={styles['error-message']}>
                  {error}
                </div>
              )}

              {success && (
                <div className={styles['success-message']}>
                  {success}
                </div>
              )}

              <div className={styles["form-actions"]}>
                <button
                  onClick={handleGenerateDocument}
                  disabled={isGenerating}
                  className={styles["generate-btn"]}
                >
                  {isGenerating ? (
                    <>
                      <span className={styles["loading-spinner"]}></span>
                      Генерирање...
                    </>
                  ) : (
                    "Генерирај документ"
                  )}
                </button>
              </div>
            </div>

            {/* Preview Section */}
            <div className={styles.previewSection}>
              <DocumentPreview
                formData={formData}
                documentType="politicsForDataProtection"
                currentStep={1}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default PoliticsForDataProtectionPage;
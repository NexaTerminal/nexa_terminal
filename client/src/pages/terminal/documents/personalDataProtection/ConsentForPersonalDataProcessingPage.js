import React, { useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import Header from "../../../../components/common/Header";
import Sidebar from "../../../../components/terminal/Sidebar";
import ProfileReminderBanner from "../../../../components/terminal/ProfileReminderBanner";
import DocumentPreview from "../../../../components/terminal/documents/DocumentPreview";
import styles from "../../../../styles/terminal/documents/DocumentGeneration.module.css";

const ConsentForPersonalDataProcessingPage = () => {
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    // companyName: currentUser?.company?.name || '',
    // companyAddress: currentUser?.company?.address || '',
    // companyTaxNumber: currentUser?.company?.taxNumber || '',
    employeeName: "",
    employeeAddress: "",
    employeeWorkPosition: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.employeeName.trim())
      newErrors.employeeName = "Ова поле е задолжително";
    if (!formData.employeeAddress.trim())
      newErrors.employeeAddress = "Ова поле е задолжително";
    if (!formData.employeeWorkPosition.trim())
      newErrors.employeeWorkPosition = "Ова поле е задолжително";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerateDocument = async () => {
    if (!validateForm()) return;

    if (!currentUser) {
      alert("Мора да бидете најавени за да генерирате документ.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch('/api/auto-documents/consent-for-personal-data-processing', {
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
      a.download = 'consent-for-personal-data-processing.docx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('Document downloaded successfully!');
      setError(null);
    } catch (error) {
      setError(error.message);
      setSuccess(null);
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
                  <div className={styles["form-group"]}>
                    <label htmlFor="employeeName">
                      Име и презиме на вработениот *
                    </label>
                    <input
                      type="text"
                      id="employeeName"
                      value={formData.employeeName}
                      onChange={(e) =>
                        handleInputChange("employeeName", e.target.value)
                      }
                      placeholder="пр. Марко Петровски"
                      className={errors.employeeName ? styles.error : ""}
                    />
                    {errors.employeeName && (
                      <span className={styles["error-message"]}>
                        {errors.employeeName}
                      </span>
                    )}
                  </div>

                  <div className={styles["form-group"]}>
                    <label htmlFor="employeeAddress">
                      Адреса на вработениот *
                    </label>
                    <input
                      type="text"
                      id="employeeAddress"
                      value={formData.employeeAddress}
                      onChange={(e) =>
                        handleInputChange("employeeAddress", e.target.value)
                      }
                      placeholder="пр. ул. Македонија бр. 123, Скопје"
                      className={errors.employeeAddress ? styles.error : ""}
                    />
                    {errors.employeeAddress && (
                      <span className={styles["error-message"]}>
                        {errors.employeeAddress}
                      </span>
                    )}
                  </div>

                  <div className={styles["form-group"]}>
                    <label htmlFor="employeeWorkPosition">
                      Работна позиција *
                    </label>
                    <input
                      type="text"
                      id="employeeWorkPosition"
                      value={formData.employeeWorkPosition}
                      onChange={(e) =>
                        handleInputChange(
                          "employeeWorkPosition",
                          e.target.value
                        )
                      }
                      placeholder="пр. Софтверски инженер"
                      className={
                        errors.employeeWorkPosition ? styles.error : ""
                      }
                    />
                    {errors.employeeWorkPosition && (
                      <span className={styles["error-message"]}>
                        {errors.employeeWorkPosition}
                      </span>
                    )}
                  </div>
                </div>
              </div>

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
                documentType="consentForPersonalDataProcessing"
                currentStep={1}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default ConsentForPersonalDataProcessingPage;

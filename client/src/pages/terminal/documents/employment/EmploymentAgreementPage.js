import React, { useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import Header from "../../../../components/common/Header";
import Sidebar from "../../../../components/terminal/Sidebar";
import ProfileReminderBanner from "../../../../components/terminal/ProfileReminderBanner";
import DocumentPreview from "../../../../components/terminal/documents/DocumentPreview";
import styles from "../../../../styles/terminal/documents/DocumentGeneration.module.css";
import { getCSRFToken } from "../../../../services/csrfService";

const EmploymentAgreementPage = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    employeeName: "",
    employeeAddress: "",
    employeePIN: "",
    jobPosition: "",
    workTasks: [""],
    netSalary: "",
    placeOfWork: "просториите на седиштето на работодавачот",
    otherWorkPlace: "",
    agreementDate: "",
    agreementDurationType: "неопределено времетраење.",
    definedDuration: "",
    dailyWorkTime: "започнува од 08:00 часот, а завршува во 16:00 часот",
    otherWorkTime: "",
    concurrentClause: false,
    concurrentClauseInput: ""
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.employeeName.trim())
      newErrors.employeeName = "Ова поле е задолжително";
    if (!formData.employeeAddress.trim())
      newErrors.employeeAddress = "Ова поле е задолжително";
    if (!formData.employeePIN.trim())
      newErrors.employeePIN = "Ова поле е задолжително";
    if (!formData.jobPosition.trim())
      newErrors.jobPosition = "Ова поле е задолжително";
    if (!formData.workTasks[0] || !formData.workTasks[0].trim())
      newErrors.workTasks = "Најмалку една работна обврска е задолжителна";
    if (!formData.netSalary.trim())
      newErrors.netSalary = "Ова поле е задолжително";
    if (!formData.agreementDate.trim())
      newErrors.agreementDate = "Ова поле е задолжително";
    
    // Conditional validation
    if (formData.placeOfWork === 'Друго место' && !formData.otherWorkPlace.trim())
      newErrors.otherWorkPlace = "Наведете го местото на работа";
    if (formData.agreementDurationType === 'определено времетраење' && !formData.definedDuration.trim())
      newErrors.definedDuration = "Наведете го крајниот датум";
    if (formData.dailyWorkTime === 'other' && !formData.otherWorkTime.trim())
      newErrors.otherWorkTime = "Наведете го работното време";
    if (formData.concurrentClause && !formData.concurrentClauseInput.trim())
      newErrors.concurrentClauseInput = "Наведете ги деталите за конкурентската клаузула";

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
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5001/api";
      const csrfToken = await getCSRFToken();
      const response = await fetch(
        `${apiUrl}/auto-documents/employment-agreement`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify({ formData }),
        }
      );
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Договор_за_вработување.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Неуспешно генерирање на документот: ${error.message}`);
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
          <div className={styles.splitLayout}>
            {/* Form Section */}
            <div className={styles.formSection}>
              <div className={styles["form-sections"]}>
                {/* Employee Information */}
                <div className={styles["form-section"]}>
                  <h3>Основни податоци за работникот</h3>
                  <div className={styles["form-group"]}>
                    <label htmlFor="employeeName">Име и презиме на работникот *</label>
                    <input
                      type="text"
                      id="employeeName"
                      value={formData.employeeName}
                      onChange={(e) => handleInputChange("employeeName", e.target.value)}
                      placeholder="пр. Марко Петровски"
                      className={errors.employeeName ? styles.error : ""}
                    />
                    {errors.employeeName && (
                      <span className={styles["error-message"]}>{errors.employeeName}</span>
                    )}
                  </div>
                  <div className={styles["form-group"]}>
                    <label htmlFor="employeeAddress">Адреса на седиште на работникот *</label>
                    <input
                      type="text"
                      id="employeeAddress"
                      value={formData.employeeAddress}
                      onChange={(e) => handleInputChange("employeeAddress", e.target.value)}
                      placeholder="пр. ул. Македонија бр. 123, Скопје"
                      className={errors.employeeAddress ? styles.error : ""}
                    />
                    {errors.employeeAddress && (
                      <span className={styles["error-message"]}>{errors.employeeAddress}</span>
                    )}
                  </div>
                  <div className={styles["form-group"]}>
                    <label htmlFor="employeePIN">ЕМБГ на работникот *</label>
                    <input
                      type="text"
                      id="employeePIN"
                      value={formData.employeePIN}
                      onChange={(e) => handleInputChange("employeePIN", e.target.value)}
                      placeholder="пр. 1234567890123"
                      className={errors.employeePIN ? styles.error : ""}
                    />
                    {errors.employeePIN && (
                      <span className={styles["error-message"]}>{errors.employeePIN}</span>
                    )}
                  </div>
                  <div className={styles["form-group"]}>
                    <label htmlFor="jobPosition">Назив на работна позиција *</label>
                    <input
                      type="text"
                      id="jobPosition"
                      value={formData.jobPosition}
                      onChange={(e) => handleInputChange("jobPosition", e.target.value)}
                      placeholder="пр. Софтверски инженер"
                      className={errors.jobPosition ? styles.error : ""}
                    />
                    {errors.jobPosition && (
                      <span className={styles["error-message"]}>{errors.jobPosition}</span>
                    )}
                  </div>
                </div>

                {/* Work Tasks */}
                <div className={styles["form-section"]}>
                  <h3>Работни обврски</h3>
                  <div className={styles["form-group"]}>
                    <label>Работни обврски *</label>
                    {formData.workTasks.map((task, index) => (
                      <div key={index} className={styles["array-field"]}>
                        <input
                          type="text"
                          placeholder="Работна обврска"
                          value={task}
                          onChange={(e) => handleWorkTaskChange(index, e.target.value)}
                          className={errors.workTasks ? styles.error : ""}
                        />
                        {formData.workTasks.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeWorkTask(index)} 
                            className={styles["remove-btn"]}
                          >
                            Отстрани
                          </button>
                        )}
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={addWorkTask} 
                      className={styles["add-btn"]}
                    >
                      Додади обврска на работникот
                    </button>
                    {errors.workTasks && (
                      <span className={styles["error-message"]}>{errors.workTasks}</span>
                    )}
                  </div>
                </div>

                {/* Salary and Date */}
                <div className={styles["form-section"]}>
                  <h3>Плата и датум на договор</h3>
                  <div className={styles["form-group"]}>
                    <label htmlFor="netSalary">Основна плата *</label>
                    <input
                      type="number"
                      id="netSalary"
                      value={formData.netSalary}
                      onChange={(e) => handleInputChange("netSalary", e.target.value)}
                      placeholder="пр. 25000"
                      className={errors.netSalary ? styles.error : ""}
                    />
                    {errors.netSalary && (
                      <span className={styles["error-message"]}>{errors.netSalary}</span>
                    )}
                  </div>
                  <div className={styles["form-group"]}>
                    <label htmlFor="agreementDate">Датум на склучување на договор за вработување *</label>
                    <input
                      type="date"
                      id="agreementDate"
                      value={formData.agreementDate}
                      onChange={(e) => handleInputChange("agreementDate", e.target.value)}
                      className={errors.agreementDate ? styles.error : ""}
                    />
                    {errors.agreementDate && (
                      <span className={styles["error-message"]}>{errors.agreementDate}</span>
                    )}
                  </div>
                </div>

                {/* Working Conditions */}
                <div className={styles["form-section"]}>
                  <h3>Работни услови</h3>
                  <div className={styles["form-group"]}>
                    <label htmlFor="placeOfWork">Место на вршење на работата</label>
                    <select
                      id="placeOfWork"
                      value={formData.placeOfWork}
                      onChange={(e) => handleInputChange("placeOfWork", e.target.value)}
                    >
                      <option value="просториите на седиштето на работодавачот">Седиштето на работодавачот</option>
                      <option value="Друго место">Друго место</option>
                    </select>
                  </div>
                  {formData.placeOfWork === 'Друго место' && (
                    <div className={styles["form-group"]}>
                      <label htmlFor="otherWorkPlace">Наведете го местото на вршење на работите *</label>
                      <input
                        type="text"
                        id="otherWorkPlace"
                        value={formData.otherWorkPlace}
                        onChange={(e) => handleInputChange("otherWorkPlace", e.target.value)}
                        placeholder="пр. ул. Партизанска 5, Скопје"
                        className={errors.otherWorkPlace ? styles.error : ""}
                      />
                      {errors.otherWorkPlace && (
                        <span className={styles["error-message"]}>{errors.otherWorkPlace}</span>
                      )}
                    </div>
                  )}
                  <div className={styles["form-group"]}>
                    <label htmlFor="agreementDurationType">Времетраење на договорот за вработување</label>
                    <select
                      id="agreementDurationType"
                      value={formData.agreementDurationType}
                      onChange={(e) => handleInputChange("agreementDurationType", e.target.value)}
                    >
                      <option value="неопределено времетраење.">Неопределено времетрање</option>
                      <option value="определено времетраење">Определено времетрање</option>
                    </select>
                  </div>
                  {formData.agreementDurationType === 'определено времетраење' && (
                    <div className={styles["form-group"]}>
                      <label htmlFor="definedDuration">Наведете го последниот ден на работа на работникот *</label>
                      <input
                        type="date"
                        id="definedDuration"
                        value={formData.definedDuration}
                        onChange={(e) => handleInputChange("definedDuration", e.target.value)}
                        className={errors.definedDuration ? styles.error : ""}
                      />
                      {errors.definedDuration && (
                        <span className={styles["error-message"]}>{errors.definedDuration}</span>
                      )}
                    </div>
                  )}
                  <div className={styles["form-group"]}>
                    <label htmlFor="dailyWorkTime">Дневно работно време</label>
                    <select
                      id="dailyWorkTime"
                      value={formData.dailyWorkTime}
                      onChange={(e) => handleInputChange("dailyWorkTime", e.target.value)}
                    >
                      <option value="започнува од 08:00 часот, а завршува во 16:00 часот">08:00 - 16:00</option>
                      <option value="започнува од 08:30 часот, а завршува во 16:30 часот">08:30 - 16:30</option>
                      <option value="започнува од 09:00 часот, а завршува во 17:00 часот">09:00 - 17:00</option>
                      <option value="се определува согласно распоред за работно време">Се определува согласно распоред за работно време</option>
                      <option value="other">Друго</option>
                    </select>
                  </div>
                  {formData.dailyWorkTime === 'other' && (
                    <div className={styles["form-group"]}>
                      <label htmlFor="otherWorkTime">Наведете го дневното работно време на работникот *</label>
                      <input
                        type="text"
                        id="otherWorkTime"
                        value={formData.otherWorkTime}
                        onChange={(e) => handleInputChange("otherWorkTime", e.target.value)}
                        placeholder="пр. 09:30 - 17:30"
                        className={errors.otherWorkTime ? styles.error : ""}
                      />
                      {errors.otherWorkTime && (
                        <span className={styles["error-message"]}>{errors.otherWorkTime}</span>
                      )}
                    </div>
                  )}
                  <div className={styles["form-group"]}>
                    <label className={styles["checkbox-label"]}>
                      <input
                        type="checkbox"
                        checked={formData.concurrentClause}
                        onChange={(e) => handleInputChange("concurrentClause", e.target.checked)}
                      />
                      Конкурентска клаузула
                    </label>
                  </div>
                  {formData.concurrentClause && (
                    <div className={styles["form-group"]}>
                      <label htmlFor="concurrentClauseInput">Времетраење на конкурентска клаузула *</label>
                      <textarea
                        id="concurrentClauseInput"
                        value={formData.concurrentClauseInput}
                        onChange={(e) => handleInputChange("concurrentClauseInput", e.target.value)}
                        rows="3"
                        placeholder="пр. 6 месеци од датумот на престанок на работниот однос"
                        className={errors.concurrentClauseInput ? styles.error : ""}
                      />
                      {errors.concurrentClauseInput && (
                        <span className={styles["error-message"]}>{errors.concurrentClauseInput}</span>
                      )}
                    </div>
                  )}
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
                documentType="employmentAgreement"
                currentStep={1}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default EmploymentAgreementPage;
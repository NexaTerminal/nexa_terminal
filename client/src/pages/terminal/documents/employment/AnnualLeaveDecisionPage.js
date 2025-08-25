import React, { useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import Header from "../../../../components/common/Header";
import Sidebar from "../../../../components/terminal/Sidebar";
import ProfileReminderBanner from "../../../../components/terminal/ProfileReminderBanner";
import DocumentPreview from "../../../../components/terminal/documents/DocumentPreview";
import styles from "../../../../styles/terminal/documents/DocumentGeneration.module.css";
import { getCSRFToken } from "../../../../services/csrfService";

const TerminationAgreementPage = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    employeeName: "",
    employeePIN: "",
    employeeAddress: "",
    endDate: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState({});

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
    if (!formData.employeePIN.trim())
      newErrors.employeePIN = "Ова поле е задолжително";
    if (!formData.employeeAddress.trim())
      newErrors.employeeAddress = "Ова поле е задолжително";
    if (!formData.endDate.trim())
      newErrors.endDate = "Ова поле е задолжително";
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
        `${apiUrl}/auto-documents/termination-agreement`,
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
      a.download = `Спогодба_за_престанок_на_работен_однос.docx`;
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
                <div className={styles["form-section"]}>
                  <div className={styles["form-group"]}>
                    <label htmlFor="employeeName">Име и презиме на вработениот *</label>
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
                    <label htmlFor="employeePIN">ЕМБГ на вработениот *</label>
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
                    <label htmlFor="employeeAddress">Адреса на вработениот *</label>
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
                    <label htmlFor="endDate">Датум на престанок *</label>
                    <input
                      type="date"
                      id="endDate"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange("endDate", e.target.value)}
                      className={errors.endDate ? styles.error : ""}
                    />
                    {errors.endDate && (
                      <span className={styles["error-message"]}>{errors.endDate}</span>
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
                documentType="terminationAgreement"
                currentStep={1}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default TerminationAgreementPage; 
// import React, { useState } from "react";
// import { useAuth } from "../../../../contexts/AuthContext";
// import Header from "../../../../components/common/Header";
// import Sidebar from "../../../../components/terminal/Sidebar";
// import ProfileReminderBanner from "../../../../components/terminal/ProfileReminderBanner";
// import DocumentPreview from "../../../../components/terminal/documents/DocumentPreview";
// import styles from "../../../../styles/terminal/documents/DocumentGeneration.module.css";
// import { getCSRFToken } from "../../../../services/csrfService";

// const AnnualLeaveDecisionPage = () => {
//   const { currentUser } = useAuth();
//   const [formData, setFormData] = useState({
//     employeeName: "",
//     annualLeaveYear: "",
//     annualLeaveStart: "",
//     annualLeaveEnd: "",
//   });
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [errors, setErrors] = useState({});

//   const handleInputChange = (field, value) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//     if (errors[field]) {
//       setErrors((prev) => ({ ...prev, [field]: null }));
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};
//     if (!formData.employeeName.trim())
//       newErrors.employeeName = "Ова поле е задолжително";
//     if (!formData.annualLeaveYear.trim())
//       newErrors.annualLeaveYear = "Ова поле е задолжително";
//     if (!formData.annualLeaveStart.trim())
//       newErrors.annualLeaveStart = "Ова поле е задолжително";
//     if (!formData.annualLeaveEnd.trim())
//       newErrors.annualLeaveEnd = "Ова поле е задолжително";
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleGenerateDocument = async () => {
//     if (!validateForm()) return;
//     if (!currentUser) {
//       alert("Мора да бидете најавени за да генерирате документ.");
//       return;
//     }
//     setIsGenerating(true);
//     try {
//       const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5001/api";
//       const csrfToken = await getCSRFToken();
//       const response = await fetch(
//         `${apiUrl}/auto-documents/annual-leave-decision`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//             "X-CSRF-Token": csrfToken,
//           },
//           body: JSON.stringify({ formData }),
//         }
//       );
//       if (!response.ok) {
//         let errorMessage = `HTTP error! status: ${response.status}`;
//         try {
//           const errorData = await response.json();
//           errorMessage = errorData.message || errorMessage;
//         } catch {}
//         throw new Error(errorMessage);
//       }
//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `Решение_за_годишен_одмор.docx`;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       window.URL.revokeObjectURL(url);
//     } catch (error) {
//       alert(`Неуспешно генерирање на документот: ${error.message}`);
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   return (
//     <>
//       <Header isTerminal={true} />
//       <div className={styles.dashboardLayout}>
//         <Sidebar />
//         <main className={styles.dashboardMain}>
//           {!currentUser?.profileComplete && <ProfileReminderBanner />}
//           <div className={styles.splitLayout}>
//             {/* Form Section */}
//             <div className={styles.formSection}>
//               <div className={styles["form-sections"]}>
//                 <div className={styles["form-section"]}>
//                   <div className={styles["form-group"]}>
//                     <label htmlFor="employeeName">Име и презиме на вработениот *</label>
//                     <input
//                       type="text"
//                       id="employeeName"
//                       value={formData.employeeName}
//                       onChange={(e) => handleInputChange("employeeName", e.target.value)}
//                       placeholder="пр. Марко Петровски"
//                       className={errors.employeeName ? styles.error : ""}
//                     />
//                     {errors.employeeName && (
//                       <span className={styles["error-message"]}>{errors.employeeName}</span>
//                     )}
//                   </div>
//                   <div className={styles["form-group"]}>
//                     <label htmlFor="annualLeaveYear">Година на одмор *</label>
//                     <input
//                       type="number"
//                       id="annualLeaveYear"
//                       value={formData.annualLeaveYear}
//                       onChange={(e) => handleInputChange("annualLeaveYear", e.target.value)}
//                       placeholder="пр. 2024"
//                       className={errors.annualLeaveYear ? styles.error : ""}
//                     />
//                     {errors.annualLeaveYear && (
//                       <span className={styles["error-message"]}>{errors.annualLeaveYear}</span>
//                     )}
//                   </div>
//                   <div className={styles["form-group"]}>
//                     <label htmlFor="annualLeaveStart">Почеток на одмор *</label>
//                     <input
//                       type="date"
//                       id="annualLeaveStart"
//                       value={formData.annualLeaveStart}
//                       onChange={(e) => handleInputChange("annualLeaveStart", e.target.value)}
//                       className={errors.annualLeaveStart ? styles.error : ""}
//                     />
//                     {errors.annualLeaveStart && (
//                       <span className={styles["error-message"]}>{errors.annualLeaveStart}</span>
//                     )}
//                   </div>
//                   <div className={styles["form-group"]}>
//                     <label htmlFor="annualLeaveEnd">Крај на одмор *</label>
//                     <input
//                       type="date"
//                       id="annualLeaveEnd"
//                       value={formData.annualLeaveEnd}
//                       onChange={(e) => handleInputChange("annualLeaveEnd", e.target.value)}
//                       className={errors.annualLeaveEnd ? styles.error : ""}
//                     />
//                     {errors.annualLeaveEnd && (
//                       <span className={styles["error-message"]}>{errors.annualLeaveEnd}</span>
//                     )}
//                   </div>
//                 </div>
//               </div>
//               <div className={styles["form-actions"]}>
//                 <button
//                   onClick={handleGenerateDocument}
//                   disabled={isGenerating}
//                   className={styles["generate-btn"]}
//                 >
//                   {isGenerating ? (
//                     <>
//                       <span className={styles["loading-spinner"]}></span>
//                       Генерирање...
//                     </>
//                   ) : (
//                     "Генерирај документ"
//                   )}
//                 </button>
//               </div>
//             </div>
//             {/* Preview Section */}
//             <div className={styles.previewSection}>
//               <DocumentPreview
//                 formData={formData}
//                 documentType="annualLeaveDecision"
//                 currentStep={1}
//               />
//             </div>
//           </div>
//         </main>
//       </div>
//     </>
//   );
// };

// export default AnnualLeaveDecisionPage;

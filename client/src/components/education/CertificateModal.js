import React, { useState, useEffect } from 'react';
import styles from '../../styles/education/Certificate.module.css';
import HonorCodeModal from './HonorCodeModal';

const CertificateModal = ({ isOpen, onClose, onGenerate, userData, courseName, isGenerating }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    jobPosition: '',
    honorCodeAccepted: false
  });
  const [showHonorCode, setShowHonorCode] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Pre-fill name from user data if available
    if (userData?.fullName) {
      setFormData(prev => ({ ...prev, fullName: userData.fullName }));
    } else if (userData?.username) {
      setFormData(prev => ({ ...prev, fullName: userData.username }));
    }
  }, [userData]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Полното име е задолжително';
    }

    if (!formData.jobPosition.trim()) {
      newErrors.jobPosition = 'Работната позиција е задолжителна';
    }

    if (!formData.honorCodeAccepted) {
      newErrors.honorCodeAccepted = 'Мора да го прифатите Кодексот на чест';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onGenerate(formData);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2>🎓 Генерирај сертификат</h2>
            <button className={styles.closeButton} onClick={onClose} disabled={isGenerating}>
              ✕
            </button>
          </div>

          <div className={styles.modalBody}>
            <p className={styles.congratsText}>
              Честитки за успешното завршување на курсот <strong>{courseName}</strong>!
            </p>
            <p className={styles.instructionText}>
              Ве молиме пополнете ги следните информации за да го генерирате вашиот сертификат:
            </p>

            <form onSubmit={handleSubmit} className={styles.certificateForm}>
              <div className={styles.formGroup}>
                <label htmlFor="fullName">
                  Полно име и презиме <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={errors.fullName ? styles.inputError : ''}
                  placeholder="Внесете го вашето полно име"
                  disabled={isGenerating}
                />
                {errors.fullName && (
                  <span className={styles.errorText}>{errors.fullName}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="jobPosition">
                  Работна позиција <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="jobPosition"
                  name="jobPosition"
                  value={formData.jobPosition}
                  onChange={handleChange}
                  className={errors.jobPosition ? styles.inputError : ''}
                  placeholder="Внесете ја вашата работна позиција"
                  disabled={isGenerating}
                />
                {errors.jobPosition && (
                  <span className={styles.errorText}>{errors.jobPosition}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="honorCodeAccepted"
                    name="honorCodeAccepted"
                    checked={formData.honorCodeAccepted}
                    onChange={handleChange}
                    disabled={isGenerating}
                  />
                  <label htmlFor="honorCodeAccepted">
                    Ја прочитав и се согласувам со{' '}
                    <button
                      type="button"
                      className={styles.honorCodeLink}
                      onClick={() => setShowHonorCode(true)}
                      disabled={isGenerating}
                    >
                      Nexa Кодексот на чест
                    </button>
                    <span className={styles.required}> *</span>
                  </label>
                </div>
                {errors.honorCodeAccepted && (
                  <span className={styles.errorText}>{errors.honorCodeAccepted}</span>
                )}
              </div>

              <div className={styles.companyInfo}>
                <p>
                  <strong>Компанија:</strong> {userData?.companyInfo?.companyName || 'Не е наведена'}
                </p>
              </div>
            </form>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isGenerating}
            >
              Откажи
            </button>
            <button
              type="button"
              className={styles.generateButton}
              onClick={handleSubmit}
              disabled={isGenerating || !formData.fullName || !formData.jobPosition || !formData.honorCodeAccepted}
            >
              {isGenerating ? '⏳ Генерирам...' : '📄 Генерирај сертификат'}
            </button>
          </div>
        </div>
      </div>

      <HonorCodeModal
        isOpen={showHonorCode}
        onClose={() => setShowHonorCode(false)}
      />
    </>
  );
};

export default CertificateModal;

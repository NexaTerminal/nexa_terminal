import React, { useState, useEffect } from 'react';
import styles from '../../styles/DocumentGenerator/GenerateModal.module.css';
import { Oval } from 'react-loader-spinner'; // Using react-loader-spinner

const GenerateModal = ({ isOpen, onClose, template, categoryColor }) => {
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (template && template.fields) {
      const initialFormData = template.fields.reduce((acc, field) => {
        acc[field.name] = field.defaultValue || '';
        return acc;
      }, {});
      setFormData(initialFormData);
    }
    // Reset messages when modal opens or template changes
    setError(null);
    setSuccessMessage(null);
  }, [isOpen, template]);

  if (!isOpen || !template) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(template.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization headers if needed, e.g.,
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error generating document: ${response.statusText}`);
      }

      // Assuming the backend responds with the generated document or a link to it
      // For DOCX, it will likely be a download trigger
      if (response.headers.get('Content-Type')?.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        // Use a more specific filename if available from headers or template
        a.download = `${template.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
        setSuccessMessage('Документот е успешно генериран и преземањето започна.');
      } else {
        const result = await response.json();
        setSuccessMessage(result.message || 'Документот е успешно генериран.');
      }
      
      // Optionally close modal on success after a delay
      // setTimeout(() => {
      //   onClose();
      // }, 3000);

    } catch (err) {
      setError(err.message || 'Настана грешка при генерирање на документот.');
      console.error("Generation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (field) => {
    const commonProps = {
      key: field.name,
      name: field.name,
      id: field.name,
      value: formData[field.name] || '',
      onChange: handleChange,
      className: styles.inputField,
    };

    switch (field.type) {
      case 'textarea':
        return (
          <textarea {...commonProps} placeholder={field.placeholder || field.label} rows="3"></textarea>
        );
      case 'select':
        return (
          <select {...commonProps}>
            {field.options && field.options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              key={field.name}
              name={field.name}
              id={field.name}
              checked={formData[field.name] || false}
              onChange={handleChange}
              className={styles.checkboxInput}
            />
            <label htmlFor={field.name} className={styles.checkboxLabel}>{field.label}</label>
          </div>
        );
      case 'date':
        return <input type="date" {...commonProps} placeholder={field.placeholder || field.label} />;
      case 'number':
        return <input type="number" {...commonProps} placeholder={field.placeholder || field.label} />;
      default: // text
        return <input type="text" {...commonProps} placeholder={field.placeholder || field.label} />;
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} style={{ '--category-color': categoryColor || '#4F46E5' }}>
        <button className={styles.closeButton} onClick={onClose} disabled={isLoading}>&times;</button>
        <h2 className={styles.modalTitle}>{template.name}</h2>
        <p className={styles.modalDescription}>{template.description}</p>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

        {!successMessage && ( // Hide form after successful generation
          <form onSubmit={handleSubmit} className={styles.modalForm}>
            {template.fields.map((field) => (
              <div key={field.name} className={styles.formGroup}>
                <label htmlFor={field.name} className={styles.label}>{field.label}:</label>
                {renderField(field)}
                {field.tooltip && <small className={styles.tooltip}>{field.tooltip}</small>}
              </div>
            ))}
            <button 
              type="submit" 
              className={styles.submitButton} 
              disabled={isLoading}
              style={{ backgroundColor: categoryColor || '#4F46E5' }}
            >
              {isLoading ? (
                <Oval
                  height={20}
                  width={20}
                  color="#fff"
                  wrapperStyle={{}}
                  wrapperClass=""
                  visible={true}
                  ariaLabel='oval-loading'
                  secondaryColor="rgba(255,255,255,0.3)"
                  strokeWidth={4}
                  strokeWidthSecondary={4}
                />
              ) : 'Генерирај Документ'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default GenerateModal;

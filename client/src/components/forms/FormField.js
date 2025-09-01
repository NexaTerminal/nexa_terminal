import React from 'react';
import styles from '../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Universal Form Field Component
 * Renders different field types based on configuration
 */
const FormField = ({ 
  field, 
  value, 
  onChange, 
  error, 
  disabled = false,
  arrayMethods = null, // For array fields: { onAdd, onRemove }
  formData = {} // Need access to all form data for conditional logic
}) => {
  const { name, type, label, placeholder, required, options, rows, condition, conditional, maxLength, pattern, inputMode } = field;

  // Check if field should be shown based on condition (use either condition or conditional)
  const conditionToCheck = condition || conditional;
  if (conditionToCheck && !evaluateCondition(conditionToCheck, formData)) {
    return null;
  }

  const handleChange = (newValue) => {
    onChange(name, newValue);
  };

  const renderField = () => {
    switch (type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            type={type}
            id={name}
            placeholder={placeholder}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? styles.error : ''}
            disabled={disabled}
            maxLength={maxLength}
            pattern={pattern ? pattern.source : undefined}
            inputMode={inputMode}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            id={name}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? styles.error : ''}
            disabled={disabled}
          />
        );

      case 'textarea':
        return (
          <textarea
            id={name}
            placeholder={placeholder}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? styles.error : ''}
            rows={rows || 3}
            disabled={disabled}
          />
        );

      case 'select':
        return (
          <select
            id={name}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className={styles['checkbox-group']}>
            <input
              type="checkbox"
              id={name}
              checked={Boolean(value)}
              onChange={(e) => handleChange(e.target.checked)}
              disabled={disabled}
            />
            <label htmlFor={name}>{label}</label>
          </div>
        );

      case 'array':
        return (
          <ArrayField
            name={name}
            items={value || ['']}
            onChange={handleChange}
            placeholder={placeholder}
            error={error}
            disabled={disabled}
            arrayMethods={arrayMethods}
          />
        );

      default:
        return null;
    }
  };

  // Special handling for checkbox (label is already included)
  if (type === 'checkbox') {
    return (
      <div className={styles['form-group']}>
        {renderField()}
        {error && <span className={styles['error-message']}>{error}</span>}
      </div>
    );
  }

  return (
    <div className={styles['form-group']}>
      <label htmlFor={name}>
        {label} {required && '*'}
      </label>
      {renderField()}
      {error && <span className={styles['error-message']}>{error}</span>}
    </div>
  );
};

/**
 * Array Field Component - Handles lists of items
 */
const ArrayField = ({ 
  name, 
  items, 
  onChange, 
  placeholder, 
  error, 
  disabled,
  arrayMethods 
}) => {
  const handleItemChange = (index, newValue) => {
    const newItems = [...items];
    newItems[index] = newValue;
    onChange(newItems);
  };

  const addItem = () => {
    const newItems = [...items, ''];
    onChange(newItems);
    if (arrayMethods?.onAdd) arrayMethods.onAdd();
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      onChange(newItems);
      if (arrayMethods?.onRemove) arrayMethods.onRemove(index);
    }
  };

  return (
    <>
      {items.map((item, index) => (
        <div key={index} className={styles['array-field']}>
          <input
            type="text"
            placeholder={placeholder}
            value={item}
            onChange={(e) => handleItemChange(index, e.target.value)}
            className={error ? styles.error : ''}
            disabled={disabled}
          />
          {items.length > 1 && !disabled && (
            <button 
              type="button" 
              onClick={() => removeItem(index)} 
              className={styles['remove-btn']}
            >
              Отстрани
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <button 
          type="button" 
          onClick={addItem}
          className={styles['add-btn']}
        >
          Додади ставка
        </button>
      )}
    </>
  );
};

/**
 * Special Terms Acceptance Field
 */
export const TermsField = ({ value, onChange, disabled = false }) => {
  return (
    <div className={styles['terms-checkbox']}>
      <div className={styles['checkbox-group']}>
        <input
          type="checkbox"
          id="acceptTerms"
          checked={Boolean(value)}
          onChange={(e) => onChange('acceptTerms', e.target.checked)}
          disabled={disabled}
        />
        <label htmlFor="acceptTerms">
          Се согласувам со{' '}
          <span 
            className={styles['terms-link']} 
            onClick={() => window.open('/general-conditions', '_blank')}
          >
            општите услови
          </span>
          {' '}* (задолжително)
        </label>
      </div>
    </div>
  );
};

/**
 * Conditional Field Wrapper
 */
export const ConditionalField = ({ condition, formData, children }) => {
  if (!evaluateCondition(condition, formData)) {
    return null;
  }
  return children;
};

// Helper function to evaluate field conditions
const evaluateCondition = (condition, formData) => {
  if (!condition) return true;
  
  const { field, operator = '===', value } = condition;
  const fieldValue = formData[field];

  switch (operator) {
    case '===':
      return fieldValue === value;
    case '!==':
      return fieldValue !== value;
    case 'includes':
      return Array.isArray(fieldValue) && fieldValue.includes(value);
    case 'truthy':
      return Boolean(fieldValue);
    default:
      // Default to equality check if no operator specified
      return fieldValue === value;
  }
};

export default FormField;
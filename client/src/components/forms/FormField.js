import React, { useState, useRef, useEffect } from 'react';
import styles from '../../styles/terminal/documents/DocumentGeneration.module.css';
import jobsData from '../../data/jobs.json';

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
  const { name, type, label, placeholder, required, options, rows, condition, conditional, showWhen, maxLength, pattern, inputMode, helpText, searchable, allowCustom, dataSource, displayField, autoFillSource, autoFillField } = field;

  // Check if field should be shown based on condition (use either condition, conditional, or showWhen)
  const conditionToCheck = condition || conditional;
  if (conditionToCheck && !evaluateCondition(conditionToCheck, formData)) {
    return null;
  }
  
  // Check showWhen condition (function-based condition)
  if (showWhen && !showWhen(formData)) {
    return null;
  }

  const handleChange = (newValue) => {
    onChange(name, newValue);
    
    // Handle auto-fill when a job position is selected
    if (name === 'jobPosition' && newValue && dataSource === 'jobs') {
      const selectedJob = jobsData.find(job => job.jobPosition === newValue);
      if (selectedJob) {
        // Auto-fill work tasks
        if (selectedJob.jobTasks && Array.isArray(selectedJob.jobTasks)) {
          onChange('workTasks', selectedJob.jobTasks);
        }
        // Auto-fill education
        if (selectedJob.education) {
          onChange('education', selectedJob.education);
        }
        // Auto-fill certification
        if (selectedJob.certification) {
          onChange('certification', selectedJob.certification);
        }
      }
    }
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
            {!required && <option value="">Изберете...</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'searchable-select':
        return (
          <SearchableSelect
            name={name}
            value={value || ''}
            onChange={handleChange}
            placeholder={placeholder}
            dataSource={dataSource}
            displayField={displayField}
            searchable={searchable}
            allowCustom={allowCustom}
            disabled={disabled}
            error={error}
          />
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

      case 'radio':
        return (
          <div className={styles['radio-group']}>
            {options?.map((option) => (
              <div key={option.value} className={styles['radio-option']}>
                <input
                  type="radio"
                  id={`${name}_${option.value}`}
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleChange(e.target.value)}
                  disabled={disabled}
                />
                <label htmlFor={`${name}_${option.value}`} className={styles['radio-label']}>
                  <div className={styles['radio-content']}>
                    <strong>{option.label}</strong>
                    {option.description && (
                      <div className={styles['radio-description']}>
                        {option.description}
                      </div>
                    )}
                  </div>
                </label>
              </div>
            ))}
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
        {helpText && (
          <span className={styles['help-tooltip']} data-tooltip={helpText}>
            ❓
          </span>
        )}
      </label>
      {renderField()}
      {error && <span className={styles['error-message']}>{error}</span>}
    </div>
  );
};

/**
 * Searchable Select Component - Handles job position selection with search
 */
const SearchableSelect = ({ 
  name, 
  value, 
  onChange, 
  placeholder, 
  dataSource, 
  displayField,
  searchable,
  allowCustom,
  disabled,
  error 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState(value || '');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Get data based on dataSource
  const getData = () => {
    switch (dataSource) {
      case 'jobs':
        return jobsData;
      default:
        return [];
    }
  };

  const data = getData();
  
  // Filter data based on search term
  const filteredData = data.filter(item => 
    item[displayField]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSearchTerm(newValue);
    setIsOpen(true);
    
    // If allowCustom, update the field value immediately
    if (allowCustom) {
      onChange(newValue);
    }
  };

  const handleItemSelect = (item) => {
    const selectedValue = item[displayField];
    setInputValue(selectedValue);
    setSearchTerm('');
    setIsOpen(false);
    onChange(selectedValue);
  };

  const handleInputFocus = () => {
    if (searchable) {
      setIsOpen(true);
      setSearchTerm(inputValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div className={styles['searchable-select']} ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        id={name}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        className={error ? styles.error : ''}
        disabled={disabled}
        autoComplete="off"
      />
      
      {isOpen && !disabled && (
        <div className={styles['dropdown-list']}>
          {filteredData.length > 0 ? (
            <>
              {filteredData.slice(0, 10).map((item, index) => (
                <div
                  key={index}
                  className={styles['dropdown-item']}
                  onClick={() => handleItemSelect(item)}
                >
                  <div className={styles['job-title']}>{item[displayField]}</div>
                  {item.jobTasks && item.jobTasks.length > 0 && (
                    <div className={styles['job-preview']}>
                      {item.jobTasks.slice(0, 2).join(', ')}
                      {item.jobTasks.length > 2 && '...'}
                    </div>
                  )}
                </div>
              ))}
              {filteredData.length > 10 && (
                <div className={styles['dropdown-more']}>
                  +{filteredData.length - 10} повеќе резултати...
                </div>
              )}
            </>
          ) : (
            <div className={styles['dropdown-no-results']}>
              {allowCustom ? 'Нема резултати. Внесете сопствена позиција.' : 'Нема резултати.'}
            </div>
          )}
        </div>
      )}
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

  // Debug logging for rent agreement conditional fields
  if (field === 'otherPartyType') {
    console.log('🔍 Evaluating condition for otherParty fields:', {
      field,
      operator,
      value,
      fieldValue,
      formData: formData,
      result: fieldValue === value
    });
  }

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
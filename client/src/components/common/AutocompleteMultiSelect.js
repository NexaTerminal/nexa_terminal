import React, { useState, useRef, useEffect } from 'react';
import styles from './AutocompleteMultiSelect.module.css';

const AutocompleteMultiSelect = ({
  options = [],
  selectedValues = [],
  onChange,
  placeholder = 'Почни да пишуваш за да пребаруваш...',
  label = '',
  required = false,
  id = 'autocomplete-multiselect'
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);

  // Filter options based on input value
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(inputValue.toLowerCase()) &&
    !selectedValues.includes(option)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      setHighlightedIndex(0);
      e.preventDefault();
      return;
    }

    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelectOption(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[highlightedIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleSelectOption = (option) => {
    const newSelected = [...selectedValues, option];
    onChange(newSelected);
    setInputValue('');
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleRemoveOption = (optionToRemove) => {
    const newSelected = selectedValues.filter(option => option !== optionToRemove);
    onChange(newSelected);
  };

  const handleDropdownOptionClick = (option) => {
    handleSelectOption(option);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          id={id}
          type="text"
          className={styles.input}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={selectedValues.length === 0 ? placeholder : ''}
          autoComplete="off"
        />

        {/* Dropdown */}
        {isOpen && filteredOptions.length > 0 && (
          <div className={styles.dropdown} ref={dropdownRef}>
            {filteredOptions.map((option, index) => (
              <div
                key={option}
                className={`${styles.dropdownItem} ${
                  index === highlightedIndex ? styles.highlighted : ''
                }`}
                onClick={() => handleDropdownOptionClick(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected items as tags/chips */}
      {selectedValues.length > 0 && (
        <div className={styles.tagsContainer}>
          {selectedValues.map(value => (
            <div key={value} className={styles.tag}>
              <span className={styles.tagText}>{value}</span>
              <button
                type="button"
                className={styles.tagRemove}
                onClick={() => handleRemoveOption(value)}
                aria-label={`Remove ${value}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutocompleteMultiSelect;

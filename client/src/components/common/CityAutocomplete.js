import React, { useState, useRef, useEffect } from 'react';
import styles from './CityAutocomplete.module.css';

const CityAutocomplete = ({ cities, selectedCities, onChange, placeholder = "Внесете град..." }) => {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredCities, setFilteredCities] = useState([]);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Filter cities based on input
  useEffect(() => {
    if (inputValue.trim() === '') {
      setFilteredCities([]);
      setShowDropdown(false);
      return;
    }

    const filtered = cities.filter(city =>
      city.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedCities.includes(city)
    );

    setFilteredCities(filtered);
    setShowDropdown(filtered.length > 0);
  }, [inputValue, cities, selectedCities]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddCity = (city) => {
    onChange([...selectedCities, city]);
    setInputValue('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleRemoveCity = (cityToRemove) => {
    onChange(selectedCities.filter(city => city !== cityToRemove));
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && inputValue === '' && selectedCities.length > 0) {
      // Remove last city when backspace is pressed on empty input
      handleRemoveCity(selectedCities[selectedCities.length - 1]);
    } else if (e.key === 'Enter' && filteredCities.length > 0) {
      e.preventDefault();
      handleAddCity(filteredCities[0]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Selected cities as tags */}
      {selectedCities.length > 0 && (
        <div className={styles.tagsContainer}>
          {selectedCities.map(city => (
            <span key={city} className={styles.tag}>
              {city}
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => handleRemoveCity(city)}
                aria-label={`Remove ${city}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input field */}
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && setShowDropdown(filteredCities.length > 0)}
          placeholder={selectedCities.length === 0 ? placeholder : ''}
          className={styles.input}
          autoComplete="off"
        />

        {/* Dropdown suggestions */}
        {showDropdown && filteredCities.length > 0 && (
          <div ref={dropdownRef} className={styles.dropdown}>
            {filteredCities.slice(0, 10).map(city => (
              <button
                key={city}
                type="button"
                className={styles.dropdownItem}
                onClick={() => handleAddCity(city)}
              >
                {city}
              </button>
            ))}
            {filteredCities.length > 10 && (
              <div className={styles.dropdownInfo}>
                + {filteredCities.length - 10} повеќе
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CityAutocomplete;

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../../styles/website/TypewriterFeatures.module.css';

const enFeatures = [
  "Legal document automation",
  "Legal health check",
  "B2B networking",
  "Legal news",
  "Investment opportunities",
  "Business news"
];

const mkFeatures = [
  "Автоматизација на правни документи",
  "Правна здравствена проверка",
  "Б2Б мрежно поврзување",
  "Правни вести",
  "Инвестициски можности",
  "Деловни вести"
];

const TYPE_SPEED = 100; // ms per character
const DELETE_SPEED = 60; // ms per character
const PAUSE_DURATION = 1500; // ms - how long the full text is shown
const SHORT_PAUSE_DURATION = 300; // ms - pause after deleting, before typing next

const TypewriterFeatures = () => {
  const { i18n } = useTranslation();
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Reset displayed text and state when language changes to ensure smooth transition
    setDisplayedText('');
    setIsDeleting(false);
    // We don't reset currentFeatureIndex here to allow cycling through features even if language changes mid-cycle.
    // The effect dependency on i18n.language will pick the correct feature list.
  }, [i18n.language]);

  useEffect(() => {
    const features = i18n.language === 'mk' ? mkFeatures : enFeatures;
    // Ensure currentFeatureIndex is always valid for the current feature list length
    const safeFeatureIndex = currentFeatureIndex % features.length;
    const currentFeature = features[safeFeatureIndex];
    
    let timer;

    if (isDeleting) {
      if (displayedText.length > 0) {
        timer = setTimeout(() => {
          setDisplayedText(current => current.substring(0, current.length - 1));
        }, DELETE_SPEED);
      } else {
        // Finished deleting
        setIsDeleting(false);
        setCurrentFeatureIndex(current => (current + 1)); // No modulo here, let it grow, use modulo when accessing features array
        // Short pause before typing next, handled by the next cycle of this effect
      }
    } else { // Typing
      if (displayedText.length < currentFeature.length) {
        timer = setTimeout(() => {
          setDisplayedText(current => currentFeature.substring(0, current.length + 1));
        }, TYPE_SPEED);
      } else {
        // Finished typing, pause then start deleting
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, PAUSE_DURATION);
      }
    }

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentFeatureIndex, i18n.language]);

  return (
    <p className={styles.typewriterText}>
      {displayedText}
      <span className={styles.cursor}>|</span>
    </p>
  );
};

export default TypewriterFeatures;

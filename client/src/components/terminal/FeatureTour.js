import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from '../../styles/terminal/FeatureTour.module.css';

const STORAGE_KEY = 'nexa_tour_views';
const MAX_TOUR_VIEWS = 3;

const TOUR_STEPS = [
  {
    target: '[data-tour="documents"]',
    title: 'Автоматизирани документи',
    text: 'Генерирај документи брзо и во неколку клика.',
    position: 'right'
  },
  {
    target: '[data-tour="my-templates"]',
    title: 'Мои шаблони',
    text: 'Прикачи свој .docx и создај шаблон со динамични полиња. AI ќе ти помогне.',
    position: 'right'
  },
  {
    target: '[data-tour="screening"]',
    title: 'Скрининг',
    text: 'Провери ја правната, маркетинг и сајбер усогласеност на твојот бизнис.',
    position: 'right'
  },
  {
    target: '[data-tour="ai"]',
    title: 'Nexa AI',
    text: 'Постави правно или маркетинг прашање и добиј одговор базиран на македонското законодавство.',
    position: 'right'
  },
  {
    target: '[data-tour="find-lawyer"]',
    title: 'Најди адвокат',
    text: 'Пронајди правен експерт за твоите деловни потреби.',
    position: 'right'
  },
  {
    target: '[data-tour="education"]',
    title: 'Обуки',
    text: 'Едуцирај се со стручни содржини за бизнис и право.',
    position: 'right'
  }
];

const FeatureTour = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [arrowStyle, setArrowStyle] = useState({});

  useEffect(() => {
    // Check how many times tour has been shown
    const views = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    if (views >= MAX_TOUR_VIEWS) return;

    // Small delay to let the sidebar render
    const timer = setTimeout(() => setIsVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const positionTooltip = useCallback(() => {
    if (!isVisible) return;

    const step = TOUR_STEPS[currentStep];
    const target = document.querySelector(step.target);
    if (!target) return;

    const rect = target.getBoundingClientRect();

    // Position to the right of the sidebar item
    const top = rect.top + rect.height / 2;
    const left = rect.right + 16;

    setTooltipStyle({
      top: `${top}px`,
      left: `${left}px`,
      transform: 'translateY(-50%)'
    });

    setArrowStyle({
      top: '50%',
      left: '-6px',
      transform: 'translateY(-50%) rotate(45deg)'
    });

    // Add highlight to target
    target.setAttribute('data-tour-active', 'true');

    return () => {
      target.removeAttribute('data-tour-active');
    };
  }, [currentStep, isVisible]);

  useEffect(() => {
    const cleanup = positionTooltip();

    // Reposition on scroll/resize
    window.addEventListener('resize', positionTooltip);

    return () => {
      cleanup?.();
      window.removeEventListener('resize', positionTooltip);
      // Clean up active state from all elements
      document.querySelectorAll('[data-tour-active]').forEach(el => {
        el.removeAttribute('data-tour-active');
      });
    };
  }, [positionTooltip]);

  const handleNext = () => {
    // Remove highlight from current
    const currentTarget = document.querySelector(TOUR_STEPS[currentStep].target);
    currentTarget?.removeAttribute('data-tour-active');

    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  };

  const completeTour = () => {
    const views = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    localStorage.setItem(STORAGE_KEY, String(views + 1));
    setIsVisible(false);
    document.querySelectorAll('[data-tour-active]').forEach(el => {
      el.removeAttribute('data-tour-active');
    });
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  return createPortal(
    <>
      {/* Subtle backdrop */}
      <div className={styles.backdrop} onClick={completeTour} />

      {/* Tooltip */}
      <div className={styles.tooltip} style={tooltipStyle} key={currentStep}>
        <div className={styles.arrow} style={arrowStyle} />

        <div className={styles.content}>
          <div className={styles.header}>
            <span className={styles.stepBadge}>
              {currentStep + 1} / {TOUR_STEPS.length}
            </span>
          </div>

          <h4 className={styles.title}>{step.title}</h4>
          <p className={styles.text}>{step.text}</p>

          <div className={styles.actions}>
            <button className={styles.skipBtn} onClick={completeTour}>
              Прескокни
            </button>
            <button className={styles.nextBtn} onClick={handleNext}>
              {isLast ? 'Заврши' : 'Следно'}
              {!isLast && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div className={styles.dots}>
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className={`${styles.dot} ${i === currentStep ? styles.dotActive : ''} ${i < currentStep ? styles.dotDone : ''}`}
            />
          ))}
        </div>
      </div>
    </>,
    document.body
  );
};

export default FeatureTour;

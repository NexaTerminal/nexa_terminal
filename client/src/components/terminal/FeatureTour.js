import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from '../../styles/terminal/FeatureTour.module.css';

// v3: bumped when the sidebar sections became collapsible — the tour now
// anchors to the 4 section headers (old keys left behind are harmless).
const STORAGE_KEY = 'nexa_tour_views_v3';
const MAX_TOUR_VIEWS = 3;

// Steps anchor to the 4 collapsible SECTION HEADERS via their
// `data-tour="section-{key}"` attribute (set in components/terminal/
// Sidebar.js). Sections start collapsed, so the tour points at the group
// headers — the full map of the app: Администрирај → Набави → Расти → Учи.
const TOUR_STEPS = [
  {
    target: '[data-tour="section-administration"]',
    title: 'Администрација',
    text: 'Сè за обврските: генерирај 45+ правни документи, води ги вработените и договорите, прашај го Правниот AI и провери ја усогласеноста (правна, HR, сајбер). Кликни за да ги видиш алатките.',
    position: 'right'
  },
  {
    target: '[data-tour="section-procurement"]',
    title: 'Набавки',
    text: 'Кога купуваш: побарај понуди од проверени добавувачи — ние ги собираме и ти ги доставуваме.',
    position: 'right'
  },
  {
    target: '[data-tour="section-growth"]',
    title: 'Маркетинг и раст',
    text: 'Кога растеш: објави статија под твое име на Nexa блогот, резервирај банер во билтенот до 1000+ претплатници, користи Маркетинг AI и провери го маркетингот.',
    position: 'right'
  },
  {
    target: '[data-tour="section-education-sec"]',
    title: 'Едукација',
    text: 'Кога учиш: курсеви и стручни содржини за бизнис и право. Добредојде во Nexa!',
    position: 'right'
  }
];

const FeatureTour = () => {
  const [steps, setSteps] = useState(TOUR_STEPS);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [arrowStyle, setArrowStyle] = useState({});

  useEffect(() => {
    // Check how many times tour has been shown
    const views = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    if (views >= MAX_TOUR_VIEWS) return;

    // Small delay to let the sidebar render, then keep only the steps whose
    // sidebar item actually exists for this user (tier predicates hide some).
    const timer = setTimeout(() => {
      const present = TOUR_STEPS.filter((s) => document.querySelector(s.target));
      if (present.length === 0) return;
      setSteps(present);
      setIsVisible(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const positionTooltip = useCallback(() => {
    if (!isVisible) return;

    const step = steps[currentStep];
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
  }, [currentStep, isVisible, steps]);

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
    const currentTarget = document.querySelector(steps[currentStep].target);
    currentTarget?.removeAttribute('data-tour-active');

    if (currentStep < steps.length - 1) {
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

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

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
              {currentStep + 1} / {steps.length}
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
          {steps.map((_, i) => (
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

import React, { useState, useEffect, useMemo } from 'react';
import styles from '../../styles/terminal/RightSidebar.module.css';
import didYouKnowFacts from '../../data/didYouKnowFacts.json';
// Commented out marketing imports
// import marketingSpotsData from '../../data/marketingSpots.json';

const RightSidebar = () => {
  // Get random facts from all categories
  const sidebarFacts = useMemo(() => {
    // Collect all facts from all categories
    const allFacts = [
      ...didYouKnowFacts.legal,
      ...didYouKnowFacts.business,
      ...didYouKnowFacts.marketing,
      ...didYouKnowFacts.investments,
      ...didYouKnowFacts.general
    ];

    // Shuffle and pick 4 random facts
    const shuffled = [...allFacts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  }, []);

  // Commented out marketing carousel state and logic
  /*
  const [marketingSpots] = useState(marketingSpotsData);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef(null);

  // Auto-rotate through marketing spots
  useEffect(() => {
    if (isPaused || marketingSpots.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % marketingSpots.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused, marketingSpots.length]);

  // Generate visible slots (2 above, 1 center, 2 below)
  const getVisibleSlots = () => {
    if (marketingSpots.length === 0) return [];

    const slots = [];
    const totalSlots = 5;
    const centerIndex = 2;

    for (let i = 0; i < totalSlots; i++) {
      const offset = i - centerIndex;
      const index = (currentIndex + offset + marketingSpots.length) % marketingSpots.length;
      slots.push({
        ...marketingSpots[index],
        position: i,
        isCenter: i === centerIndex,
      });
    }

    return slots;
  };

  const handleSlotClick = (slot) => {
    if (slot.isCenter) {
      window.open(slot.link, '_blank', 'noopener,noreferrer');
    }
  };

  const visibleSlots = getVisibleSlots();
  */

  return (
    <aside className={styles.rightSidebar}>
      <div className={styles.didYouKnowContainer}>
        <div className={styles.didYouKnow}>
          <div className={styles.didYouKnowHeader}>
            <svg className={styles.didYouKnowIcon} width="22" height="22" viewBox="0 0 20 20" fill="none">
              <path d="M10 2C7.23858 2 5 4.23858 5 7C5 8.95608 6.12432 10.6488 7.75 11.4649V13C7.75 13.5523 8.19772 14 8.75 14H11.25C11.8023 14 12.25 13.5523 12.25 13V11.4649C13.8757 10.6488 15 8.95608 15 7C15 4.23858 12.7614 2 10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 17H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 14V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M11 14V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <h3 className={styles.didYouKnowTitle}>Дали знаевте?</h3>
          </div>
          <div className={styles.factsList}>
            {sidebarFacts.map((fact, index) => (
              <div key={`${fact.id}-${index}`} className={styles.factCard}>
                <p className={styles.factText}>{fact.fact}</p>
                <span className={styles.factSource}>{fact.source}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commented out marketing carousel
      <div className={styles.marketingCarouselContainer}>
        <div
          ref={carouselRef}
          className={styles.slotMachineContainer}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className={styles.slotTrack}>
            {visibleSlots.map((slot, idx) => (
              <div
                key={`${slot.companyName}-${idx}`}
                className={`${styles.slot} ${
                  slot.isCenter ? styles.slotCenter : ''
                } ${slot.position < 2 ? styles.slotAbove : ''} ${
                  slot.position > 2 ? styles.slotBelow : ''
                }`}
                onClick={() => handleSlotClick(slot)}
                style={{
                  transform: `translateY(${(slot.position - 2) * 100}%)`,
                }}
              >
                <div className={styles.slotContent}>
                  <img
                    src={slot.image}
                    alt={slot.companyName}
                    className={styles.slotImage}
                  />
                  <div className={styles.slotOverlay}>
                    <h4 className={styles.slotCompanyName}>{slot.companyName}</h4>
                    {slot.isCenter && (
                      <div className={styles.slotClickHint}>Кликни за повеќе</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.centerFocusIndicator}>
            <div className={styles.focusBorderTop}></div>
            <div className={styles.focusBorderBottom}></div>
          </div>
        </div>

        <div className={styles.carouselDots}>
          {marketingSpots.map((_, idx) => (
            <button
              key={idx}
              className={`${styles.dot} ${idx === currentIndex ? styles.dotActive : ''}`}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to spot ${idx + 1}`}
            />
          ))}
        </div>
      </div>
      */}
    </aside>
  );
};

export default RightSidebar;

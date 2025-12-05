import React, { useState, useEffect, useRef } from 'react';
import styles from '../../styles/terminal/RightSidebar.module.css';
import marketingSpotsData from '../../data/marketingSpots.json';

const RightSidebar = () => {
  const [marketingSpots] = useState(marketingSpotsData);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef(null);

  // Auto-rotate through marketing spots
  useEffect(() => {
    if (isPaused || marketingSpots.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % marketingSpots.length);
    }, 3000); // Change every 3 seconds

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

  if (marketingSpots.length === 0) {
    return (
      <aside className={styles.rightSidebar}>
        <div className={styles.noMarketingData}>
          Нема достапни маркетинг споменици
        </div>
      </aside>
    );
  }

  return (
    <aside className={styles.rightSidebar}>
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

          {/* Center focus indicator */}
          <div className={styles.centerFocusIndicator}>
            <div className={styles.focusBorderTop}></div>
            <div className={styles.focusBorderBottom}></div>
          </div>
        </div>

        {/* Navigation dots */}
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
    </aside>
  );
};

export default RightSidebar;

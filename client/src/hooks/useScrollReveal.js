import { useEffect } from 'react';

/**
 * Adds the `.nx-revealed` class to every `.nx-reveal` element when it enters
 * the viewport. Idempotent — runs once per mount, cleans up on unmount.
 *
 * Usage: just call useScrollReveal() in a page component and add `nx-reveal`
 * to any element you want to fade-in-up on scroll.
 */
export default function useScrollReveal() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const els = document.querySelectorAll('.nx-reveal');
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('nx-revealed');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

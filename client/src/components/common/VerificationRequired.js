import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { hasFeatureAccess, isAccountSuspended, hasFreeDocPass } from '../../lib/tier';
import styles from '../../styles/VerificationRequired.module.css';

/**
 * Gates the feature surfaces (document generators, screenings, AI tools,
 * courses, marketing) on ACTIVE feature access. This is the client-side mirror
 * of server/middleware/subscriptionGuard.js — necessary because the document
 * pages render their live preview + public share link entirely client-side and
 * never hit the gated API, so a suspended / expired-trial user could otherwise
 * still produce and copy a /preview/... link.
 *
 * Wraps exactly the premium routes in App.js (and nothing the user needs to
 * re-subscribe — dashboard, profile, subscription pages stay reachable).
 */
const VerificationRequired = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  // No user yet (loading) or full access → render normally. PrivateRoute
  // already handles the unauthenticated case upstream.
  if (!currentUser || hasFeatureAccess(currentUser)) {
    return <>{children}</>;
  }

  // One-free-document pass: a locked funnel registrant may open the DOCUMENT
  // pages (only) to use their single free generation. The server-side guard
  // (subscriptionGuard → creditMiddleware) enforces the single use.
  if (hasFreeDocPass(currentUser) && location.pathname.startsWith('/terminal/documents')) {
    return <>{children}</>;
  }

  const suspended = isAccountSuspended(currentUser);
  const title = suspended ? 'Сметката е суспендирана' : 'Потребна е активна претплата';
  const text = suspended
    ? (currentUser.suspensionReason
        ? `Вашата сметка е суспендирана: ${currentUser.suspensionReason}. Контактирајте нè за повеќе информации.`
        : 'Вашата сметка е суспендирана. Контактирајте нè за повеќе информации.')
    : 'Изберете план за да продолжите со користење на алатките на Терминалот.';

  const openGate = () => {
    try {
      window.dispatchEvent(new CustomEvent('subscription:blocked', {
        detail: {
          code: suspended ? 'ACCOUNT_SUSPENDED' : 'SUBSCRIPTION_SUSPENDED',
          message: text,
          subscription: currentUser.subscription || {}
        }
      }));
    } catch (_) { /* SSR / older browsers */ }
  };

  return (
    <div className={styles.lockedWrap}>
      <div className={styles.lockedCard}>
        <div className={styles.lockedIcon} aria-hidden>{suspended ? '⛔' : '🔒'}</div>
        <h2 className={styles.lockedTitle}>{title}</h2>
        <p className={styles.lockedText}>{text}</p>
        {!suspended && (
          <button type="button" className={styles.lockedButton} onClick={openGate}>
            Изберете план
          </button>
        )}
      </div>
    </div>
  );
};

export default VerificationRequired;

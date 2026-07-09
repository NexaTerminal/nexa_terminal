import React, { useState, useEffect } from "react";
import styles from "../../styles/terminal/Dashboard.module.css";
import Header from "../../components/common/Header";
import Sidebar from "../../components/terminal/Sidebar";
import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";
import RightSidebar from "../../components/terminal/RightSidebar";
import UpdatesFeed from "../../components/terminal/UpdatesFeed";
import SubscriptionStatusBanner from "../../components/terminal/SubscriptionStatusBanner";
import LockedWelcome from "../../components/terminal/LockedWelcome";
import UpcomingObligations from "../../components/terminal/UpcomingObligations";
import CommandCenter from "../../components/terminal/CommandCenter";
import FeatureTour from "../../components/terminal/FeatureTour";
import { PROMO_FLASH_KEY } from "../../components/PromoRedeemWatcher";

const Dashboard = () => {
  const { currentUser, token } = useAuth();

  // Locked account: registered but never activated (no code, no payment).
  // Owners only — admin bypasses, sub-seats inherit the parent's access.
  const isLocked =
    !!currentUser &&
    currentUser.role !== 'admin' &&
    currentUser.role !== 'sub_seat' &&
    (!currentUser.subscription || currentUser.subscription.status === 'none');

  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [promoFlash, setPromoFlash] = useState(null);

  // One-time promo notice after a deep-link code redemption. PromoRedeemWatcher
  // stashes it, redirects here; we show it once then clear the key.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROMO_FLASH_KEY);
      if (raw) {
        setPromoFlash(JSON.parse(raw));
        localStorage.removeItem(PROMO_FLASH_KEY);
      }
    } catch (_) { /* ignore */ }
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/users/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setCompanyData(data.company);
        }
      } catch (error) {
        setError("Грешка при преземање на профилот");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [token]);

  return (
    <>
      <Header isTerminal={true} />
      <Sidebar />
      <FeatureTour />
      {error && (
        <div className="text-center" style={{ color: "red", marginTop: 20 }}>
          {error}
        </div>
      )}

      <div className={styles["dashboard-layout"]}>
        <main className={styles["dashboard-main"]}>
          {promoFlash && (
            <div className={`${styles.promoFlash} ${promoFlash.ok ? styles.promoFlashOk : styles.promoFlashErr}`} role="status">
              <span className={styles.promoFlashIcon} aria-hidden>{promoFlash.ok ? '✓' : '⚠️'}</span>
              <span className={styles.promoFlashMsg}>{promoFlash.msg}</span>
              <button type="button" className={styles.promoFlashClose} onClick={() => setPromoFlash(null)} aria-label="Затвори">×</button>
            </div>
          )}

          {/* Locked accounts get the selling onboarding panel instead of the
              slim strip + feed dead-end (master-plan Phase 0.1). */}
          {isLocked ? (
            <LockedWelcome />
          ) : (
            <>
              <SubscriptionStatusBanner />

              {/* Compliance command center (master-plan Phase 3) — the main
                  stage. The admin updates feed stays below as secondary. */}
              <CommandCenter />
              <UpcomingObligations />

              {loading ? (
                <div className="text-center">
                  <p>Се вчитува...</p>
                </div>
              ) : null}

              <UpdatesFeed />
            </>
          )}
        </main>

        <RightSidebar />
      </div>
    </>
  );
};

export default Dashboard;
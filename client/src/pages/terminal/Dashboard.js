import React, { useState, useEffect } from "react";
import styles from "../../styles/terminal/Dashboard.module.css";
import Header from "../../components/common/Header";
import Sidebar from "../../components/terminal/Sidebar";
import { useAuth } from "../../contexts/AuthContext";
import RightSidebar from "../../components/terminal/RightSidebar";
import UpdatesFeed from "../../components/terminal/UpdatesFeed";
import SubscriptionStatusBanner from "../../components/terminal/SubscriptionStatusBanner";
import FeatureTour from "../../components/terminal/FeatureTour";
import LockedWelcome from "../../components/terminal/LockedWelcome";
import ProHome from "./ProHome";
import { isFunnelLockedAccount } from "../../lib/tier";
import { activeProduct } from "../../lib/storefront";
import { PROMO_FLASH_KEY } from "../../components/PromoRedeemWatcher";

const Dashboard = () => {
  const { currentUser, token } = useAuth();
  // Fresh, never-activated accounts (proverka funnel / code-first onboarding)
  // get the full onboarding panel instead of the empty updates feed. It also
  // surfaces their public compliance-check result via ?result= / localStorage.
  const locked = isFunnelLockedAccount(currentUser);
  // Domain-driven shell: on leads.nexa.mk (Product B) an active member gets the
  // Pro cockpit (ProHome); on nexa.mk (Product A) they keep the SMB updates feed.
  // Locked/never-activated accounts get the per-product LockedWelcome either way.
  const isPro = activeProduct() === 'B';
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

      {/* Product B (leads.nexa.mk), active account → the full-bleed dark "Case
          Desk". Rendered outside the standard grid (no right sidebar) so it owns
          the canvas. Locked accounts fall through to the standard layout below. */}
      {isPro && !locked ? (
        <ProHome />
      ) : (
        <div className={styles["dashboard-layout"]}>
          <main className={styles["dashboard-main"]}>
            {promoFlash && (
              <div className={`${styles.promoFlash} ${promoFlash.ok ? styles.promoFlashOk : styles.promoFlashErr}`} role="status">
                <span className={styles.promoFlashIcon} aria-hidden>{promoFlash.ok ? '✓' : '⚠️'}</span>
                <span className={styles.promoFlashMsg}>{promoFlash.msg}</span>
                <button type="button" className={styles.promoFlashClose} onClick={() => setPromoFlash(null)} aria-label="Затвори">×</button>
              </div>
            )}

            {locked ? (
              /* Locked (never-activated) account: full onboarding + funnel result. */
              <LockedWelcome />
            ) : (
              <>
                <SubscriptionStatusBanner />

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
      )}
    </>
  );
};

export default Dashboard;
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

// Keys shared with the public /redeem landing and the subscription page.
export const PENDING_PROMO_KEY = 'nexa_pending_promo';
export const PROMO_FLASH_KEY   = 'nexa_promo_flash';

/**
 * Applies a stashed promo code once the user is authenticated, regardless of
 * how they arrived (email-verify, login, username-login, OAuth). The /redeem
 * deep link only stores the code; this watcher does the redemption so it works
 * uniformly across every auth entry path.
 */
export default function PromoRedeemWatcher() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const busy = useRef(false);

  useEffect(() => {
    const code = localStorage.getItem(PENDING_PROMO_KEY);
    if (!currentUser || !code || busy.current) return;
    busy.current = true;

    (async () => {
      try {
        const res = await ApiService.request('/subscription/redeem-code', {
          method: 'POST',
          body: JSON.stringify({ code })
        });
        const plan = res?.subscription?.plan;
        const tier = (plan === 'basic' || plan === 'standard') ? 'Основен' : 'Про';
        localStorage.setItem(PROMO_FLASH_KEY, JSON.stringify({
          ok: true,
          msg: `Кодот е успешно искористен — вашиот ${tier} пристап е активен 30 дена.`
        }));
      } catch (e) {
        localStorage.setItem(PROMO_FLASH_KEY, JSON.stringify({
          ok: false,
          msg: e.message || 'Кодот не може да се искористи.'
        }));
      } finally {
        localStorage.removeItem(PENDING_PROMO_KEY);
        busy.current = false;
        navigate('/terminal/subscription');
      }
    })();
  }, [currentUser, navigate]);

  return null;
}

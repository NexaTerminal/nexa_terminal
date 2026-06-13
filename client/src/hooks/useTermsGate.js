import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { CURRENT_VERSIONS } from '../data/featureTerms';

/**
 * Gates a posting/usage action behind acceptance of the feature's terms.
 *
 * Usage:
 *   const { requireTerms, termsModal } = useTermsGate();
 *   <button onClick={() => requireTerms('blog', () => submit())}>Поднеси</button>
 *   {termsModal && <FeatureTermsModal {...termsModal} />}
 *
 * Acceptance is recorded per-user on the backend (audit trail) and the modal is
 * only shown once per feature, re-appearing if the terms version is bumped.
 */
export default function useTermsGate() {
  const { token } = useAuth();
  const [accepted, setAccepted] = useState(null); // { feature: version } | null while loading
  const [pending, setPending] = useState(null);   // { feature, onProceed }
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    axios.get('/api/terms/status', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { if (active) setAccepted(r.data?.accepted || {}); })
      .catch(() => { if (active) setAccepted({}); });
    return () => { active = false; };
  }, [token]);

  const requireTerms = useCallback((feature, onProceed) => {
    const cur = CURRENT_VERSIONS[feature] || 1;
    const acc = accepted || {};
    if ((acc[feature] || 0) >= cur) { onProceed(); return; }
    setPending({ feature, onProceed });
  }, [accepted]);

  const handleAccept = useCallback(async () => {
    if (!pending || busy) return;
    const { feature, onProceed } = pending;
    const version = CURRENT_VERSIONS[feature] || 1;
    setBusy(true);
    try {
      await axios.post('/api/terms/accept', { feature, version },
        { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {
      // Fail-open: the user consented in the UI; a record hiccup shouldn't block them.
    }
    setAccepted((a) => ({ ...(a || {}), [feature]: version }));
    setBusy(false);
    setPending(null);
    onProceed();
  }, [pending, busy, token]);

  const handleDecline = useCallback(() => setPending(null), []);

  return {
    requireTerms,
    termsModal: pending
      ? { feature: pending.feature, isOpen: true, onAccept: handleAccept, onDecline: handleDecline }
      : null
  };
}

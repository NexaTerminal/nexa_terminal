import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import styles from './PersonaControl.module.css';

/**
 * PersonaControl — lets the user pick the AI's "persona" (voice/style) directly
 * from the chat. Rides on the existing stance-preferences API: a persona is a
 * one-click preset that the backend expands into the stance prefix injected into
 * the AI prompt.
 *
 * UX: on first use (no persona chosen yet, not previously dismissed) a modal
 * opens automatically. Afterwards it collapses into a small chip in the chat
 * header; clicking it reopens the picker. Advanced users can open the full
 * stance page for granular control.
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
const DISMISS_KEY = 'nexaPersonaPickerDismissed';

// Visual accent per persona (icon only — labels/blurbs come from the backend
// catalog so the two never drift).
const PERSONA_ICON = {
  practical: '⚖️',
  protector: '🛡️',
  direct: '🔥',
  mentor: '🎓',
};

export default function PersonaControl() {
  const [catalog, setCatalog] = useState([]);
  const [persona, setPersona] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Load current persona + catalog once.
  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${API_BASE_URL}/ai/stance`, { headers: authHeaders() })
      .then((res) => {
        if (cancelled) return;
        const prefs = res.data?.preferences || {};
        const cat = res.data?.personas || [];
        setCatalog(cat);
        setPersona(prefs.persona || null);
        setLoaded(true);
        // First-use auto-open: no persona chosen and not previously dismissed.
        if (!prefs.persona && localStorage.getItem(DISMISS_KEY) !== '1') {
          setOpen(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true); // fail quietly — control just stays hidden-ish
      });
    return () => { cancelled = true; };
  }, [authHeaders]);

  const choose = async (key) => {
    setSaving(true);
    try {
      await axios.put(
        `${API_BASE_URL}/ai/stance`,
        { persona: key },
        { headers: authHeaders() }
      );
      setPersona(key);
      localStorage.setItem(DISMISS_KEY, '1');
      setOpen(false);
    } catch (e) {
      // keep modal open on failure so the user can retry
      console.warn('Failed to save persona:', e?.message);
    } finally {
      setSaving(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setOpen(false);
  };

  if (!loaded) return null;

  const current = catalog.find((p) => p.key === persona);

  return (
    <>
      <button
        type="button"
        className={styles.chip}
        onClick={() => setOpen(true)}
        title="Смени го стилот на асистентот"
        aria-label="Смени го стилот на асистентот"
      >
        <span className={styles.chipIcon}>{persona ? PERSONA_ICON[persona] : '✨'}</span>
        <span className={styles.chipLabel}>{current ? current.label : 'Избери стил'}</span>
        <span className={styles.chipEdit} aria-hidden="true">✎</span>
      </button>

      {open && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Избор на стил на асистентот">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Каков асистент сакаш?</h2>
              <p className={styles.modalSubtitle}>
                Избери го стилот на одговорите. Секогаш можеш да го смениш подоцна.
              </p>
            </div>

            <div className={styles.grid}>
              {catalog.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className={`${styles.card} ${persona === p.key ? styles.cardActive : ''}`}
                  onClick={() => choose(p.key)}
                  disabled={saving}
                >
                  <span className={styles.cardIcon}>{PERSONA_ICON[p.key] || '✨'}</span>
                  <span className={styles.cardLabel}>{p.label}</span>
                  <span className={styles.cardBlurb}>{p.blurb}</span>
                  {persona === p.key && <span className={styles.cardBadge}>Активно</span>}
                </button>
              ))}
            </div>

            <div className={styles.modalFooter}>
              <a href="/terminal/ai/stance" className={styles.advancedLink}>
                Напредно подесување →
              </a>
              <button type="button" className={styles.laterBtn} onClick={dismiss} disabled={saving}>
                Подоцна
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

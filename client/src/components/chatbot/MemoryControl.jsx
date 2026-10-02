import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import styles from './MemoryControl.module.css';

/**
 * MemoryControl — lets the user see and manage what the AI Team "remembers"
 * about them (Layer 1 durable memory). Rides on /api/ai/memory.
 *
 * UX: a small 🧠 chip in the chat header (next to PersonaControl). Clicking it
 * opens a panel listing remembered facts (each deletable), a master on/off
 * toggle (stops both injection and learning), and a „Исчисти сè" action.
 * Memory is shared across all legal agents, so this reads the same everywhere.
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const DOMAIN_LABEL = {
  employment: 'Работни односи',
  corporate: 'Друштва',
  contracts: 'Договори',
  tax: 'Даноци',
  data: 'Лични податоци',
  general: 'Општо',
};

export default function MemoryControl() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [facts, setFacts] = useState([]);
  const [busy, setBusy] = useState(false);

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const apply = useCallback((mem) => {
    setEnabled(mem?.enabled !== false);
    setFacts(Array.isArray(mem?.facts) ? mem.facts : []);
  }, []);

  const load = useCallback(() => {
    axios
      .get(`${API_BASE_URL}/ai/memory`, { headers: authHeaders() })
      .then((res) => { apply(res.data?.memory); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [authHeaders, apply]);

  useEffect(() => { load(); }, [load]);

  // Refresh when opening so freshly-learned facts show up.
  const openPanel = () => { setOpen(true); load(); };

  const toggleEnabled = async () => {
    setBusy(true);
    try {
      const res = await axios.put(
        `${API_BASE_URL}/ai/memory/enabled`,
        { enabled: !enabled },
        { headers: authHeaders() }
      );
      apply(res.data?.memory);
    } catch (e) {
      console.warn('Failed to toggle memory:', e?.message);
    } finally {
      setBusy(false);
    }
  };

  const removeFact = async (id) => {
    setBusy(true);
    try {
      const res = await axios.delete(`${API_BASE_URL}/ai/memory/${id}`, { headers: authHeaders() });
      apply(res.data?.memory);
    } catch (e) {
      console.warn('Failed to delete fact:', e?.message);
    } finally {
      setBusy(false);
    }
  };

  const clearAll = async () => {
    setBusy(true);
    try {
      const res = await axios.delete(`${API_BASE_URL}/ai/memory`, { headers: authHeaders() });
      apply(res.data?.memory);
    } catch (e) {
      console.warn('Failed to clear memory:', e?.message);
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return null;

  return (
    <>
      <button
        type="button"
        className={styles.chip}
        onClick={openPanel}
        title="Што паметам за тебе"
        aria-label="Меморија на асистентот"
      >
        <span className={styles.chipIcon}>🧠</span>
        {facts.length > 0 && <span className={styles.chipCount}>{facts.length}</span>}
      </button>

      {open && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Меморија на асистентот">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>🧠 Што паметам за тебе</h2>
              <p className={styles.modalSubtitle}>
                Тимот памети неколку трајни факти за твојот бизнис за да дава поперсонализирани
                одговори. Сите агенти ја гледаат истата меморија.
              </p>
            </div>

            <label className={styles.toggleRow}>
              <span>Меморија {enabled ? 'вклучена' : 'исклучена'}</span>
              <button
                type="button"
                className={`${styles.switch} ${enabled ? styles.switchOn : ''}`}
                onClick={toggleEnabled}
                disabled={busy}
                aria-pressed={enabled}
                aria-label="Вклучи/исклучи меморија"
              >
                <span className={styles.knob} />
              </button>
            </label>

            {facts.length === 0 ? (
              <p className={styles.empty}>
                Сè уште нема запаметени факти. Како што разговараш, тимот ќе запамети стабилни
                работи за твојот бизнис (дејност, правна форма, повторливи теми).
              </p>
            ) : (
              <ul className={styles.list}>
                {facts.map((f) => (
                  <li key={f.id} className={styles.item}>
                    <div className={styles.itemText}>
                      <span className={styles.badge}>{DOMAIN_LABEL[f.domain] || 'Општо'}</span>
                      {f.text}
                    </div>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => removeFact(f.id)}
                      disabled={busy}
                      title="Избриши факт"
                      aria-label="Избриши факт"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className={styles.modalFooter}>
              {facts.length > 0 && (
                <button type="button" className={styles.clearBtn} onClick={clearAll} disabled={busy}>
                  Исчисти сè
                </button>
              )}
              <button type="button" className={styles.closeBtn} onClick={() => setOpen(false)} disabled={busy}>
                Затвори
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

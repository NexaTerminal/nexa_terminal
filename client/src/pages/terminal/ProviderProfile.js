import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import styles from './ProviderProfile.module.css';

// MK labels for the practice-area enum (server/constants/roles.js PRACTICE_AREAS).
const AREA_LABELS = {
  'consumer-legal':       'Потрошувачко право',
  'immigration':          'Имиграција и престој',
  'citizenship':          'Државјанство',
  'company-registration': 'Регистрација на фирми',
  'ip-law':               'Интелектуална сопственост',
  'tax-accounting':       'Данок и сметководство',
  'labor-law':            'Работно право',
  'general-legal':        'Општо правно'
};

/**
 * Provider profile — de-merge Phase 4. A Pro (admin_user) picks the practice
 * areas + cities they want leads for. Areas that are full (cap reached) and
 * not already held are disabled; the server re-enforces the cap on save.
 */
export default function ProviderProfile() {
  const { token } = useAuth();
  const [areas, setAreas] = useState([]);        // [{ area, count, cap, held, full }]
  const [selected, setSelected] = useState([]);  // string[]
  const [citiesText, setCitiesText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get('/api/admin-user/provider-profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data || {};
      setAreas(data.areas || []);
      setSelected(data.profile?.practiceAreas || []);
      setCitiesText((data.profile?.cities || []).join(', '));
    } catch (e) {
      setError(e.response?.data?.message || 'Грешка при вчитување.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const toggle = (area, disabled) => {
    if (disabled) return;
    setSelected((s) => s.includes(area) ? s.filter((a) => a !== area) : [...s, area]);
  };

  const save = async () => {
    setSaving(true); setError(''); setFlash('');
    try {
      const cities = citiesText.split(',').map((c) => c.trim()).filter(Boolean);
      const res = await axios.put('/api/admin-user/provider-profile',
        { practiceAreas: selected, cities },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelected(res.data?.profile?.practiceAreas || selected);
      setFlash('Профилот е зачуван. Ќе добивате случаи за избраните области.');
      load(); // refresh cap counts
    } catch (e) {
      if (e.response?.status === 409 && e.response?.data?.code === 'AREA_CAP_REACHED') {
        const full = (e.response.data.areas || []).map((a) => AREA_LABELS[a] || a).join(', ');
        setError(`Овие области се пополнети во моментов: ${full}. Отстранете ги и обидете се повторно.`);
      } else {
        setError(e.response?.data?.message || 'Грешка при зачувување.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <TerminalShell>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1>Мој профил во мрежата</h1>
            <p className={styles.lead}>
              Изберете ги правните области и градовите за кои сакате да добивате случаи.
              Бројот на правници по област е ограничен за да останат случаите вредни.
            </p>
          </div>
        </div>

        {flash && <div className={styles.flash}>{flash}</div>}
        {error && <div className={styles.error}>{error}</div>}

        {loading ? (
          <div className={styles.loading}>Се вчитува…</div>
        ) : (
          <>
            <div className={styles.sectionLabel}>Правни области</div>
            <div className={styles.areaGrid}>
              {areas.map(({ area, count, cap, held, full }) => {
                const checked = selected.includes(area);
                const disabled = full && !checked;
                return (
                  <button
                    type="button"
                    key={area}
                    className={`${styles.areaCard} ${checked ? styles.areaCardOn : ''} ${disabled ? styles.areaCardOff : ''}`}
                    onClick={() => toggle(area, disabled)}
                    aria-pressed={checked}
                    disabled={disabled}
                  >
                    <span className={styles.areaCheck} aria-hidden>{checked ? '✓' : ''}</span>
                    <span className={styles.areaName}>{AREA_LABELS[area] || area}</span>
                    <span className={styles.areaMeta}>
                      {cap > 0
                        ? (disabled ? 'Пополнето' : `${count}/${cap} места`)
                        : 'Без ограничување'}
                      {held && <span className={styles.areaHeld}> · Ваша</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className={styles.sectionLabel}>Градови</div>
            <input
              type="text"
              className={styles.citiesInput}
              placeholder="пр. Скопје, Битола, Охрид (оставете празно за сите)"
              value={citiesText}
              onChange={(e) => setCitiesText(e.target.value)}
            />
            <p className={styles.hint}>Одделете со запирка. Празно значи дека прифаќате случаи од сите градови.</p>

            <div className={styles.actions}>
              <button className={styles.btnPrimary} onClick={save} disabled={saving}>
                {saving ? 'Се зачувува…' : 'Зачувај'}
              </button>
            </div>
          </>
        )}
      </div>
    </TerminalShell>
  );
}

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import styles from './StancePreferences.module.css';

const FREE_NOTE_MAX = 300;

const QUESTIONS = [
  {
    key: 'riskPosture',
    label: 'Однос кон ризик',
    helper: 'Како сакате AI помошникот да Ве води низ ризик?',
    options: [
      { value: 'conservative',  label: 'Конзервативно' },
      { value: 'balanced',      label: 'Балансирано'   },
      { value: 'opportunistic', label: 'Опортунистички' }
    ]
  },
  {
    key: 'contractRelation',
    label: 'Преференци за договорни односи',
    helper: 'Долгорочни цврсто-врзани договори, или пократки и лесни за излез?',
    options: [
      { value: 'long_term', label: 'Долгорочни' },
      { value: 'balanced',  label: 'Балансирано' },
      { value: 'easy_exit', label: 'Лесни за излез' }
    ]
  },
  {
    key: 'detailLevel',
    label: 'Ниво на детал',
    helper: 'Сè испишано детално, или пократки и општи одговори?',
    options: [
      { value: 'detailed', label: 'Детално'    },
      { value: 'balanced', label: 'Балансирано' },
      { value: 'general',  label: 'Општо'      }
    ]
  },
  {
    key: 'commercialPriority',
    label: 'Комерцијален vs. релациски приоритет',
    helper: 'Кога има компромис, што претежнува: комерцијална заштита или релација?',
    options: [
      { value: 'commercial',   label: 'Комерцијален'   },
      { value: 'balanced',     label: 'Балансирано'    },
      { value: 'relationship', label: 'Релациски'      }
    ]
  },
  {
    key: 'reviewTone',
    label: 'Тон на прегледи',
    helper: 'Сакате AI да го означува секое можно прашање, или само најматеријалните?',
    options: [
      { value: 'cautious',  label: 'Внимателно' },
      { value: 'pragmatic', label: 'Прагматично' }
    ]
  }
];

const EMPTY = {
  riskPosture: null,
  contractRelation: null,
  detailLevel: null,
  commercialPriority: null,
  reviewTone: null,
  freeNote: ''
};

export default function StancePreferencesPage() {
  const { token } = useAuth();
  const [prefs, setPrefs] = useState(EMPTY);
  const [saved, setSaved] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let cancelled = false;
    axios.get('/api/ai/stance', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (cancelled) return;
        const p = res.data?.preferences || EMPTY;
        const next = {
          riskPosture:        p.riskPosture        || null,
          contractRelation:   p.contractRelation   || null,
          detailLevel:        p.detailLevel        || null,
          commercialPriority: p.commercialPriority || null,
          reviewTone:         p.reviewTone         || null,
          freeNote:           p.freeNote           || ''
        };
        setPrefs(next);
        setSaved(next);
      })
      .catch(err => { if (!cancelled) setToast({ type: 'error', text: err.response?.data?.message || err.message }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  const dirty = useMemo(() => JSON.stringify(prefs) !== JSON.stringify(saved), [prefs, saved]);
  const noteLeft = FREE_NOTE_MAX - (prefs.freeNote?.length || 0);

  const pickOption = (key, value) => {
    setPrefs(p => ({ ...p, [key]: p[key] === value ? null : value }));
  };

  const setNote = (e) => {
    const v = e.target.value.slice(0, FREE_NOTE_MAX);
    setPrefs(p => ({ ...p, freeNote: v }));
  };

  const save = async () => {
    setSaving(true);
    setToast(null);
    try {
      const res = await axios.put('/api/ai/stance', prefs, { headers: { Authorization: `Bearer ${token}` } });
      const p = res.data?.preferences || EMPTY;
      const next = { ...EMPTY, ...p };
      setSaved(next);
      setPrefs(next);
      setToast({ type: 'ok', text: 'Преференците се зачувани.' });
    } catch (err) {
      setToast({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => setPrefs({ ...EMPTY });

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Nexa AI</span>
          <h1 className={styles.title}>Лични преференци</h1>
          <p className={styles.lead}>
            Поставете како сакате AI помошникот да одговара во Ваше име. Овие
            преференци се применуваат за Правен AI, Маркетинг AI и Анализа на
            договор. Може да ги смените во секое време.
          </p>
        </header>

        {loading ? (
          <div className={styles.loading}>Се вчитува…</div>
        ) : (
          <form
            className={styles.form}
            onSubmit={(e) => { e.preventDefault(); if (dirty) save(); }}
          >
            {QUESTIONS.map(q => (
              <fieldset key={q.key} className={styles.field}>
                <legend className={styles.legend}>{q.label}</legend>
                <p className={styles.helper}>{q.helper}</p>
                <div className={styles.pillRow}>
                  {q.options.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.pill} ${prefs[q.key] === opt.value ? styles.pillActive : ''}`}
                      onClick={() => pickOption(q.key, opt.value)}
                      aria-pressed={prefs[q.key] === opt.value}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}

            <fieldset className={styles.field}>
              <legend className={styles.legend}>Дополнително (опционално)</legend>
              <p className={styles.helper}>
                Дополнителни преференци за стил, терминологија или контекст
                што секогаш да ги имам предвид.
              </p>
              <textarea
                className={styles.textarea}
                value={prefs.freeNote || ''}
                onChange={setNote}
                maxLength={FREE_NOTE_MAX}
                rows={4}
                placeholder="На пр. Секогаш референцирај македонско право; користи прецизна правна терминологија."
              />
              <div className={styles.counter}>{noteLeft} карактери преостанати</div>
            </fieldset>

            {toast && (
              <div className={toast.type === 'ok' ? styles.toastOk : styles.toastError} role="status">
                {toast.text}
              </div>
            )}

            <div className={styles.actions}>
              <button
                type="submit"
                disabled={!dirty || saving}
                className={styles.btnSave}
              >
                {saving ? 'Се зачувува…' : 'Зачувај преференци'}
              </button>
              <button type="button" onClick={reset} className={styles.btnReset}>
                Очисти и врати на стандардно
              </button>
            </div>
          </form>
        )}
      </div>
    </TerminalShell>
  );
}

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './OwnCompanyModal.module.css';

/**
 * Shown when a Pro user picks "Мојата фирма (стандардно)" but has no company
 * data saved yet. Collects the required company fields, persists them to the
 * user's profile (so they're recorded and reused next time), and hands the
 * saved values back so the document fields prefill immediately.
 */
const FIELDS = [
  { name: 'companyName', label: 'Име на фирма', placeholder: 'Целосен назив на друштвото' },
  { name: 'companyAddress', label: 'Адреса', placeholder: 'Улица и број, град' },
  { name: 'companyTaxNumber', label: 'Даночен број (ЕДБ)', placeholder: '13-цифрен даночен број' },
  { name: 'companyManager', label: 'Управител', placeholder: 'Име и презиме на управителот' },
];

export default function OwnCompanyModal({ isOpen, onClose, onSaved }) {
  const { currentUser, updateProfile } = useAuth();
  const c = currentUser?.companyInfo || {};
  const [values, setValues] = useState({
    companyName: c.companyName || '',
    companyAddress: c.companyAddress || c.address || '',
    companyTaxNumber: c.companyTaxNumber || c.taxNumber || '',
    companyManager: c.companyManager || c.manager || c.role || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const setField = (name, v) => setValues(prev => ({ ...prev, [name]: v }));
  const canSave = FIELDS.every(f => values[f.name]?.trim());

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const companyInfo = {
        companyName: values.companyName.trim(),
        companyAddress: values.companyAddress.trim(),
        companyTaxNumber: values.companyTaxNumber.trim(),
        companyManager: values.companyManager.trim(),
      };
      await updateProfile({ companyInfo });
      onSaved(companyInfo);
    } catch (e) {
      setError(e.message || 'Зачувувањето не успеа. Обидете се повторно.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
        <h3 className={styles.title}>Податоци за вашата фирма</h3>
        <p className={styles.subtitle}>
          Немаме зачувано податоци за вашата фирма. Внесете ги за да се пополни
          документот — ќе се зачуваат во вашиот профил и ќе се користат
          автоматски следниот пат.
        </p>

        {FIELDS.map(f => (
          <label key={f.name} className={styles.field}>
            <span className={styles.label}>{f.label}</span>
            <input
              className={styles.input}
              type="text"
              value={values[f.name]}
              placeholder={f.placeholder}
              onChange={e => setField(f.name, e.target.value)}
              disabled={saving}
            />
          </label>
        ))}

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose} disabled={saving}>
            Откажи
          </button>
          <button type="button" className={styles.save} onClick={handleSave} disabled={!canSave || saving}>
            {saving ? 'Се зачувува…' : 'Зачувај и продолжи'}
          </button>
        </div>
      </div>
    </div>
  );
}

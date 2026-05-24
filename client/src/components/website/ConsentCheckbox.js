import { useTranslation } from 'react-i18next';
import styles from './ConsentCheckbox.module.css';

export default function ConsentCheckbox({ checked, onChange, id = 'consent' }) {
  const { t } = useTranslation('website');
  return (
    <label htmlFor={id} className={styles.box}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className={styles.text}>
        <div>{t('consent.label')}</div>
        <div>{t('consent.p1')}</div>
        <div>{t('consent.p2')}</div>
        <div>{t('consent.p3')}</div>
      </div>
    </label>
  );
}
